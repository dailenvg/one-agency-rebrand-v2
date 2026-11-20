"""Exact bounding boxes for Figma-exported SVG elements (absolute M/L/H/V/C/Z paths, rect, circle, ellipse).
Rects honour their own matrix/translate/scale transform; other elements are assumed untransformed."""
import re
import xml.etree.ElementTree as ET

NS = "{http://www.w3.org/2000/svg}"
ET.register_namespace("", "http://www.w3.org/2000/svg")


def _cubic_extrema(p0, p1, p2, p3):
    a = -p0 + 3 * p1 - 3 * p2 + p3
    b = 2 * (p0 - 2 * p1 + p2)
    c = p1 - p0
    ts = []
    if abs(a) < 1e-12:
        if abs(b) > 1e-12:
            ts.append(-c / b)
    else:
        disc = b * b - 4 * a * c
        if disc >= 0:
            r = disc ** 0.5
            ts += [(-b + r) / (2 * a), (-b - r) / (2 * a)]
    vals = [p0, p3]
    for t in ts:
        if 0 < t < 1:
            mt = 1 - t
            vals.append(mt**3 * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t**3 * p3)
    return min(vals), max(vals)


def path_bbox(d):
    toks = re.findall(r"[MLHVCZmlhvcz]|-?\d*\.?\d+(?:e-?\d+)?", d)
    xs, ys = [], []
    i, cmd, cx, cy, sx, sy = 0, None, 0.0, 0.0, 0.0, 0.0

    def num():
        nonlocal i
        v = float(toks[i]); i += 1
        return v

    while i < len(toks):
        t = toks[i]
        if re.match(r"[A-Za-z]", t):
            cmd = t; i += 1
            if cmd in "Zz":
                cx, cy = sx, sy
                continue
        if cmd not in "MLHVCZ":
            raise ValueError("relative command " + cmd)
        if cmd == "M":
            cx, cy = num(), num(); sx, sy = cx, cy; cmd = "L"
        elif cmd == "L":
            cx, cy = num(), num()
        elif cmd == "H":
            cx = num()
        elif cmd == "V":
            cy = num()
        elif cmd == "C":
            x1, y1, x2, y2, x, y = (num() for _ in range(6))
            lo, hi = _cubic_extrema(cx, x1, x2, x); xs += [lo, hi]
            lo, hi = _cubic_extrema(cy, y1, y2, y); ys += [lo, hi]
            cx, cy = x, y
        xs.append(cx); ys.append(cy)
    return min(xs), min(ys), max(xs), max(ys)


def _matrix(transform):
    """A transform list (matrix, translate, scale) as one affine matrix (a, b, c, d, e, f)."""
    m = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    for name, args in re.findall(r"(matrix|translate|scale)\(([^)]*)\)", transform or ""):
        v = [float(n) for n in re.findall(r"-?\d*\.?\d+(?:e-?\d+)?", args)]
        if name == "translate":
            step = (1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0)
        elif name == "scale":
            step = (v[0], 0, 0, v[1] if len(v) > 1 else v[0], 0, 0)
        else:
            step = tuple(v)
        a, b, c, d, e, f = m
        a2, b2, c2, d2, e2, f2 = step
        m = (a * a2 + c * b2, b * a2 + d * b2, a * c2 + c * d2, b * c2 + d * d2, a * e2 + c * f2 + e, b * e2 + d * f2 + f)
    return m


def _rect_bbox(x, y, w, h, transform):
    """Box of a rect after its own transform, from its four transformed corners."""
    a, b, c, d, e, f = _matrix(transform)
    pts = [(a * px + c * py + e, b * px + d * py + f) for px in (x, x + w) for py in (y, y + h)]
    return (min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts))


def elem_bbox(el):
    tag = el.tag.replace(NS, "")
    f = lambda k, dflt=0.0: float(el.get(k, dflt))
    if tag == "path":
        b = path_bbox(el.get("d"))
    elif tag == "rect":
        b = _rect_bbox(f("x"), f("y"), f("width"), f("height"), el.get("transform"))
    elif tag == "circle":
        b = (f("cx") - f("r"), f("cy") - f("r"), f("cx") + f("r"), f("cy") + f("r"))
    elif tag == "ellipse":
        b = (f("cx") - f("rx"), f("cy") - f("ry"), f("cx") + f("rx"), f("cy") + f("ry"))
    elif tag == "g":
        bs = [elem_bbox(c) for c in el if c.tag.replace(NS, "") in ("path", "rect", "circle", "ellipse", "g")]
        return union(bs)
    else:
        return None
    sw = float(el.get("stroke-width", 0)) / 2 if el.get("stroke") else 0
    return (b[0] - sw, b[1] - sw, b[2] + sw, b[3] + sw)


def union(bs):
    bs = [b for b in bs if b]
    return (min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs))
