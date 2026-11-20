"""Build one-dvg, the ONE Agency display face: a wide, heavy, unicase geometric grotesk.

Every outline is drawn here from geometric primitives (rectangles, polygons, superellipses)
combined with boolean ops. No existing font is read, traced, or sampled.

Run: python3 scripts/build-font.py
Needs: pip3 install --user fonttools brotli skia-pathops
"""
import math
import os

import pathops
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.roundingPen import RoundingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import newTable
from fontTools.ttLib.tables._k_e_r_n import KernTable_format_0

OUT_DIR = "src/assets/fonts"
SPECIMEN = "design/one-dvg/specimen.png"
FAMILY = "one-dvg"
STYLE = "ExtraBold"
VERSION = "1.000"
COPYRIGHT = "© 2026 ONE Agency. Original design."
DESIGNER = "dvg"

# Vertical metrics (units per em = 1000).
UPM = 1000
CAP = 720
ASCENT = 950
DESCENT = -250
OS_ = 14  # overshoot for rounds, top and bottom

# Stroke weights. Horizontals run thinner than verticals so the colour reads even.
V = 180   # straight vertical stem
HS = 150  # horizontal stroke (bars, arms)
H3 = 140  # horizontals in three-storey letters (B E F S 3 8)
VR = 190  # round vertical, at the widest point of a bowl
HR = 154  # round horizontal, at the top and bottom of a bowl
VD = 172  # diagonal, measured perpendicular to the stroke

N_OUT = 2.55  # superellipse exponent of outer contours
N_IN = 2.85   # inner contours run a little squarer so the stroke thins gently at 45 degrees

# Sidebearings by edge type.
SB_STEM = 58
SB_ROUND = 38
SB_OPEN = 30
SB_DIAG = 12
SB_PUNCT = 44

BIG = 5000


# ---------------------------------------------------------------- primitives

def poly(*pts):
    path = pathops.Path()
    pen = path.getPen()
    pen.moveTo(pts[0])
    for pt in pts[1:]:
        pen.lineTo(pt)
    pen.closePath()
    return path


def rect(x0, y0, x1, y1):
    return poly((x0, y0), (x0, y1), (x1, y1), (x1, y0))


def kappa(n):
    """Cubic handle ratio whose curve passes through the superellipse point at 45 degrees."""
    return (8 * 2 ** (-1 / n) - 4) / 3


def squircle(cx, cy, a, b, n=N_OUT):
    k = kappa(n)
    path = pathops.Path()
    pen = path.getPen()
    pen.moveTo((cx, cy + b))
    pen.curveTo((cx + k * a, cy + b), (cx + a, cy + k * b), (cx + a, cy))
    pen.curveTo((cx + a, cy - k * b), (cx + k * a, cy - b), (cx, cy - b))
    pen.curveTo((cx - k * a, cy - b), (cx - a, cy - k * b), (cx - a, cy))
    pen.curveTo((cx - a, cy + k * b), (cx - k * a, cy + b), (cx, cy + b))
    pen.closePath()
    return path


def union(*paths):
    out = paths[0]
    for path in paths[1:]:
        out = pathops.op(out, path, pathops.PathOp.UNION)
    return out


def diff(a, *bs):
    for b in bs:
        a = pathops.op(a, b, pathops.PathOp.DIFFERENCE)
    return a


def inter(a, b):
    return pathops.op(a, b, pathops.PathOp.INTERSECTION)


def transform(path, matrix):
    out = pathops.Path()
    path.draw(TransformPen(out.getPen(), matrix))
    return out


def shift(path, dx, dy=0):
    return transform(path, (1, 0, 0, 1, dx, dy))


def rotate180(path, cx, cy):
    return transform(path, (-1, 0, 0, -1, 2 * cx, 2 * cy))


def flip_y(path, cy):
    return transform(path, (1, 0, 0, -1, 0, 2 * cy))


def flip_x(path, cx):
    return transform(path, (-1, 0, 0, 1, 2 * cx, 0))


def clip(path, x0, y0, x1, y1):
    return inter(path, rect(x0, y0, x1, y1))


def above(y):
    return rect(-BIG, y, BIG, BIG)


def below(y):
    return rect(-BIG, -BIG, BIG, y)


def right_of(x):
    return rect(x, -BIG, BIG, BIG)


def left_of(x):
    return rect(-BIG, -BIG, x, BIG)


# ---------------------------------------------------------------- strokes

def run_width(t, dx, dy):
    """Horizontal width of a stroke of perpendicular thickness t along direction (dx, dy)."""
    return t * math.hypot(dx, dy) / abs(dy)


def diag(xb, yb, xt, yt, t):
    """Stroke with horizontal (flat) cuts, centreline from (xb, yb) up to (xt, yt)."""
    hw = run_width(t, xt - xb, yt - yb) / 2
    return poly((xb - hw, yb), (xt - hw, yt), (xt + hw, yt), (xb + hw, yb))


def extend_up(xb, xt, yt, t, extra=260):
    """Flat-footed stroke from (xb, 0) toward (xt, yt), continued past it so a later cut can trim it."""
    k = (yt + extra) / yt
    return diag(xb, 0, xb + (xt - xb) * k, yt + extra, t)


def bar(p0, p1, t):
    """Butt-capped straight stroke between two points."""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    length = math.hypot(dx, dy)
    nx, ny = -dy / length * t / 2, dx / length * t / 2
    return poly((p0[0] + nx, p0[1] + ny), (p1[0] + nx, p1[1] + ny),
                (p1[0] - nx, p1[1] - ny), (p0[0] - nx, p0[1] - ny))


def vee(x0, x1, yb, yt, ap, t=VD):
    """A V with a flat foot of width ap. Returns (shape, hull)."""
    cx = (x0 + x1) / 2
    dx, dy = cx - ap / 2 - x0, yt - yb
    w = run_width(t, dx, dy)
    hull = poly((x0, yt), (x1, yt), (cx + ap / 2, yb), (cx - ap / 2, yb))
    slope = dx / dy

    def left_inner(y):
        return x0 + w + (yt - y) * slope

    top = yt + 100
    reach = (x1 - x0 - 2 * w) / (2 * dx)
    if reach < 1:
        floor = [(cx, yt - reach * dy)]
    else:
        lo = yb - 100
        floor = [(2 * cx - left_inner(lo), lo), (left_inner(lo), lo)]
    inner = poly((left_inner(top), top), (2 * cx - left_inner(top), top), *floor)
    return diff(hull, inner), hull


def ring(cx, cy, a, b, vr=VR, hr=HR, n=N_OUT, n_in=N_IN):
    return diff(squircle(cx, cy, a, b, n), squircle(cx, cy, a - vr, b - hr, n_in))


def ring_box(x0, y0, x1, y1, vr=VR, hr=HR, n=N_OUT, n_in=N_IN):
    return ring((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, vr, hr, n, n_in)


def bowl(x0, y0, x1, y1, a, vr=VR, hr_top=HS, hr_bot=HS, stem=V):
    """D-shaped bowl: flat on the left (where it joins a stem), superelliptic on the right."""
    cxs = x1 - a
    b = (y1 - y0) / 2
    half = right_of(cxs)
    outer = union(rect(x0, y0, cxs, y1), inter(squircle(cxs, y0 + b, a, b), half))
    bi = (y1 - y0 - hr_top - hr_bot) / 2
    cyi = y0 + hr_bot + bi
    inner = union(rect(x0 + stem, y0 + hr_bot, cxs, y1 - hr_top),
                  inter(squircle(cxs, cyi, a - vr, bi, N_IN), half))
    return diff(outer, inner)


def u_bowl(w, cy, stem=V):
    """U: two stems running into a superelliptic bowl that overshoots the baseline."""
    cx = w / 2
    lower = below(cy)
    outer = union(rect(0, cy, w, CAP), inter(squircle(cx, cy, cx, cy + OS_), lower))
    inner = union(rect(stem, cy, w - stem, CAP + 1),
                  inter(squircle(cx, cy, cx - stem, cy + OS_ - HR, N_IN), lower))
    return diff(outer, inner)


def dot(x, y, size=200):
    return squircle(x + size / 2, y + size / 2, size / 2, size / 2, 3.2)


def stacked_rings(w, mid, inset_top, h=H3, vr=VR):
    """Upper and lower rings for S, 3, 8. The rings share the spine band around y = mid."""
    upper = ring_box(inset_top, mid - h / 2, w - inset_top, CAP + OS_, vr, h)
    lower = ring_box(0, -OS_, w, mid + h / 2, vr, h)
    return upper, lower


def tangent_from(px, py, curve):
    """Lowest line from (px, py) that touches the sampled curve. Returns (angle, touch point)."""
    return min((math.atan2(qy - py, qx - px), (qx, qy)) for qx, qy in curve)


def quadrant_points(cx, cy, a, b, n=N_OUT, quadrant=(1, -1), steps=80):
    k = kappa(n)
    sx, sy = quadrant
    p0, p1, p2, p3 = (a, 0), (a, k * b), (k * a, b), (0, b)
    pts = []
    for i in range(steps + 1):
        s = i / steps
        u = 1 - s
        x = u ** 3 * p0[0] + 3 * u * u * s * p1[0] + 3 * u * s * s * p2[0] + s ** 3 * p3[0]
        y = u ** 3 * p0[1] + 3 * u * u * s * p1[1] + 3 * u * s * s * p2[1] + s ** 3 * p3[1]
        pts.append((cx + sx * x, cy + sy * y))
    return pts


# ---------------------------------------------------------------- glyph registry

GLYPHS = {}


def glyph(name, codepoints, lsb, rsb):
    def register(fn):
        GLYPHS[name] = (list(codepoints), fn, lsb, rsb)
        return fn
    return register


def letter(ch, lsb, rsb):
    return glyph(ch, [ord(ch), ord(ch.lower())], lsb, rsb)


# ---------------------------------------------------------------- letters

@letter("A", SB_DIAG, SB_DIAG)
def draw_a():
    w = 930
    shape, hull = vee(0, w, 0, CAP, 196)
    shape, hull = flip_y(shape, CAP / 2), flip_y(hull, CAP / 2)
    crossbar = inter(rect(-10, 148, w + 10, 148 + H3), hull)
    return union(shape, crossbar), w


@letter("B", SB_STEM, SB_ROUND)
def draw_b():
    w = 820
    mid = 384
    upper = bowl(0, mid - H3 / 2, w - 44, CAP, 236, VR - 6, H3, H3)
    lower = bowl(0, 0, w, mid + H3 / 2, 262, VR, H3, H3)
    return union(upper, lower), w


@letter("C", SB_ROUND, SB_OPEN)
def draw_c():
    w = 960
    cx = w / 2
    o = ring(cx, CAP / 2, cx, CAP / 2 + OS_)
    return diff(o, rect(cx, 236, w + 10, 486)), w


@letter("D", SB_STEM, SB_ROUND)
def draw_d():
    w = 900
    return bowl(0, 0, w, CAP, 392, VR, HS, HS), w


@letter("E", SB_STEM, SB_OPEN)
def draw_e():
    w = 700
    return union(rect(0, 0, V, CAP), rect(0, CAP - H3, w - 10, CAP),
                 rect(0, 292, w - 46, 292 + H3), rect(0, 0, w, H3)), w


@letter("F", SB_STEM, SB_OPEN)
def draw_f():
    w = 690
    return union(rect(0, 0, V, CAP), rect(0, CAP - H3, w, CAP),
                 rect(0, 282, w - 46, 282 + H3)), w


@letter("G", SB_ROUND, SB_ROUND)
def draw_g():
    w = 980
    cx = w / 2
    bar_top = 388
    o = ring(cx, CAP / 2, cx, CAP / 2 + OS_)
    opened = diff(o, rect(cx, bar_top, w + 10, 522))
    spur = inter(rect(cx + 24, bar_top - HS, w + 10, bar_top),
                 squircle(cx, CAP / 2, cx, CAP / 2 + OS_))
    return union(opened, spur), w


@letter("H", SB_STEM, SB_STEM)
def draw_h():
    w = 830
    return union(rect(0, 0, V, CAP), rect(w - V, 0, w, CAP), rect(0, 294, w, 294 + HS)), w


@letter("I", SB_STEM, SB_STEM)
def draw_i():
    return rect(0, 0, V, CAP), V


@letter("J", SB_OPEN, SB_STEM)
def draw_j():
    w = 790
    return diff(u_bowl(w, 330), rect(-10, 236, V + 10, CAP + 10)), w


@letter("K", SB_STEM, SB_DIAG)
def draw_k():
    w = 870
    meet = 214  # where the arm's lower edge leaves the stem
    slope = (w - V) / (CAP - meet)
    run = run_width(VD, slope, 1)
    lower_edge = lambda y: V + (y - meet) * slope  # noqa: E731
    upper_edge = lambda y: lower_edge(y) - run  # noqa: E731
    arm = poly((upper_edge(0), 0), (upper_edge(CAP), CAP), (lower_edge(CAP), CAP), (lower_edge(0), 0))
    arm = clip(arm, 0, 0, w, CAP)
    # The leg springs from the arm, not the stem; its top hides inside the arm.
    jy = 420
    jx = lower_edge(jy) - run / 2
    leg_hw = run_width(VD + 6, w - jx, jy) / 2
    right_of_arm = poly((upper_edge(-400), -400), (upper_edge(CAP + 400), CAP + 400),
                        (BIG, CAP + 400), (BIG, -400))
    leg = clip(inter(extend_up(w - leg_hw, jx, jy, VD + 6), right_of_arm), 0, 0, w, CAP)
    return union(rect(0, 0, V, CAP), arm, leg), w


@letter("L", SB_STEM, SB_OPEN)
def draw_l():
    w = 660
    return union(rect(0, 0, V, CAP), rect(0, 0, w, HS)), w


@letter("M", SB_STEM, SB_STEM)
def draw_m():
    w = 1060
    sv = V - 8
    v, _ = vee(0, w, 0, CAP, 190, VD - 4)
    return union(rect(0, 0, sv, CAP), rect(w - sv, 0, w, CAP), v), w


@letter("N", SB_STEM, SB_STEM)
def draw_n():
    w = 850
    sv = V - 8
    run = run_width(VD, w - 200, CAP)
    for _ in range(6):
        run = run_width(VD, w - run, CAP)
    d = poly((0, CAP), (run, CAP), (w, 0), (w - run, 0))
    return union(rect(0, 0, sv, CAP), rect(w - sv, 0, w, CAP), d), w


@letter("O", SB_ROUND, SB_ROUND)
def draw_o():
    w = 1010
    return ring(w / 2, CAP / 2, w / 2, CAP / 2 + OS_), w


@letter("P", SB_STEM, SB_ROUND)
def draw_p():
    w = 800
    return union(rect(0, 0, V, CAP), bowl(0, 262, w, CAP, 270, VR, HS, HS)), w


@letter("Q", SB_ROUND, SB_ROUND)
def draw_q():
    w = 1010
    cx = w / 2
    o = ring(cx, CAP / 2, cx, CAP / 2 + OS_)
    tail = diff(diag(w - 104, -112, cx + 196, 236, VD - 6),
                squircle(cx, CAP / 2, cx - VR, CAP / 2 + OS_ - HR, N_IN))
    return union(o, tail), w


@letter("R", SB_STEM, SB_DIAG)
def draw_r():
    w = 840
    b = bowl(0, 284, w - 36, CAP, 262, VR, HS, HS)
    leg = clip(diag(w - 112, 0, 436, 284 + HS / 2 + 30, VD), 0, 0, w, CAP)
    return union(rect(0, 0, V, CAP), b, leg), w


@letter("S", SB_ROUND, SB_ROUND)
def draw_s():
    w = 860
    return s_shape(w, 374), w


def s_shape(w, mid):
    cx = w / 2
    upper, lower = stacked_rings(w, mid, 22, H3, VR - 8)
    top = inter(upper, union(left_of(cx), inter(right_of(cx), above(520))))
    bottom = inter(lower, union(right_of(cx), inter(left_of(cx), below(214))))
    return union(top, bottom)


@letter("T", SB_OPEN, SB_OPEN)
def draw_t():
    w = 800
    return union(rect(0, CAP - HS, w, CAP), rect((w - V) / 2, 0, (w + V) / 2, CAP)), w


@letter("U", SB_STEM, SB_STEM)
def draw_u():
    return u_bowl(840, 330), 840


@letter("V", SB_DIAG, SB_DIAG)
def draw_v():
    w = 920
    return vee(0, w, 0, CAP, 196)[0], w


@letter("W", SB_DIAG, SB_DIAG)
def draw_w():
    w = 1320
    t = VD - 10
    cx = w / 2
    foot = 372
    hw = run_width(t, foot - 90, CAP) / 2
    strokes = [diag(foot, 0, hw, CAP, t), diag(foot, 0, cx, CAP, t),
               diag(w - foot, 0, cx, CAP, t), diag(w - foot, 0, w - hw, CAP, t)]
    return clip(union(*strokes), 0, 0, w, CAP), w


@letter("X", SB_DIAG, SB_DIAG)
def draw_x():
    w = 880
    t = VD
    hw = run_width(t, w, CAP) / 2
    a = diag(hw, 0, w - hw - 16, CAP, t)
    b = diag(w - hw, 0, hw + 16, CAP, t)
    return clip(union(a, b), 0, 0, w, CAP), w


@letter("Y", SB_DIAG, SB_DIAG)
def draw_y():
    w = 900
    jy = 292
    arms, _ = vee(0, w, jy, CAP, V)
    return union(arms, rect((w - V) / 2, 0, (w + V) / 2, jy + 1)), w


@letter("Z", SB_OPEN, SB_OPEN)
def draw_z():
    w = 780
    h = HS
    run = 250
    for _ in range(8):
        run = run_width(VD, w - run, CAP - 2 * h)
    slope = (w - run) / (CAP - 2 * h)
    x_at = lambda y: (y - h) * slope  # noqa: E731
    d = poly((x_at(-50), -50), (x_at(CAP + 50), CAP + 50),
             (x_at(CAP + 50) + run, CAP + 50), (x_at(-50) + run, -50))
    return union(clip(d, 0, 0, w, CAP), rect(0, 0, w, h), rect(14, CAP - h, w - 14, CAP)), w


# ---------------------------------------------------------------- figures

@glyph("zero", [0x30], SB_ROUND, SB_ROUND)
def draw_zero():
    w = 800
    return ring(w / 2, CAP / 2, w / 2, CAP / 2 + OS_), w


@glyph("one", [0x31], SB_OPEN, SB_STEM)
def draw_one():
    xs = 236
    w = xs + V
    flag = poly((0, 470), (0, 640), (xs + 10, CAP), (xs + 10, 540))
    return union(rect(xs, 0, w, CAP), flag), w


@glyph("two", [0x32], SB_ROUND, SB_OPEN)
def draw_two():
    w = 790
    cx = w / 2
    y0 = 292
    cy = (y0 + CAP + OS_) / 2
    a, b = cx, (CAP + OS_ - y0) / 2
    ai, bi = a - VR, b - HR
    # The diagonal's outer edge runs from the baseline bar up to a tangent on the bowl.
    curve = quadrant_points(cx, cy, a, b)
    px = 230
    for _ in range(6):
        ang = tangent_from(px, HS, curve)[0]
        px = VD / math.sin(ang)
    ang, touch = tangent_from(px, HS, curve)
    ux, uy = math.cos(ang), math.sin(ang)
    upper_edge = lambda x: HS + (x - px) * uy / ux + VD / ux  # noqa: E731
    # Where the diagonal's inner edge enters the counter: the bowl is kept right of that point.
    floor = quadrant_points(cx, cy, ai, bi, N_IN, (-1, -1)) + quadrant_points(cx, cy, ai, bi, N_IN)
    meet = min(floor, key=lambda pt: abs(pt[1] - upper_edge(pt[0])))[0]
    r = ring(cx, cy, a, b)
    bowl_part = inter(r, union(above(cy), inter(left_of(cx), above(488)), right_of(meet)))
    far = 1200
    nx, ny = -uy * VD, ux * VD
    band = poly((px - ux * far, HS - uy * far), (px + ux * far, HS + uy * far),
                (px + ux * far + nx, HS + uy * far + ny), (px - ux * far + nx, HS - uy * far + ny))
    band = inter(band, union(squircle(cx, cy, a, b), below(touch[1])))
    band = diff(clip(band, 0, 0, w, CAP), squircle(cx, cy, ai, bi, N_IN))
    return union(bowl_part, band, rect(0, 0, w, HS)), w


@glyph("three", [0x33], SB_OPEN, SB_ROUND)
def draw_three():
    w = 800
    mid = 384
    upper, lower = stacked_rings(w, mid, 30, H3, VR - 6)
    upper = shift(upper, 10)
    cut = w / 2 - 120
    top = inter(upper, union(right_of(cut), above(516)))
    bottom = inter(lower, union(right_of(cut), below(214)))
    return union(top, bottom), w


@glyph("four", [0x34], SB_OPEN, SB_OPEN)
def draw_four():
    w = 820
    xs = 500
    bar_y = 168
    top_flat = 214
    xt = xs + V - top_flat
    run = 220
    for _ in range(6):
        run = run_width(VD, xt, CAP - bar_y - HS)
    xt = xs + V - run - 6
    d = poly((0, bar_y + HS), (xt, CAP), (xt + run, CAP), (run, bar_y + HS))
    return union(rect(xs, 0, xs + V, CAP), rect(0, bar_y, w, bar_y + HS), d), w


@glyph("five", [0x35], SB_ROUND, SB_ROUND)
def draw_five():
    w = 800
    xs = 26
    top = 468
    cx = w / 2
    r = ring_box(0, -OS_, w, top, VR, HS)
    bowl_part = inter(r, union(right_of(cx), below(212)))
    shoulder = rect(xs, top - HS, cx, top)
    stem = rect(xs, top - HS, xs + V, CAP)
    flag = rect(xs, CAP - HS, w - 30, CAP)
    return union(bowl_part, shoulder, stem, flag), w


def six_shape(w):
    cx = w / 2
    top_low = 470
    lower = ring_box(0, -OS_, w, top_low)
    cyl = (top_low - OS_) / 2
    big = ring(cx, CAP / 2, cx, CAP / 2 + OS_)
    arc = inter(big, union(inter(left_of(cx), above(CAP / 2)), inter(right_of(cx), above(548))))
    return union(lower, arc, rect(0, cyl, VR, CAP / 2))


@glyph("six", [0x36], SB_ROUND, SB_ROUND)
def draw_six():
    w = 800
    return six_shape(w), w


@glyph("seven", [0x37], SB_OPEN, SB_OPEN)
def draw_seven():
    w = 760
    xb = 120
    run = 230
    for _ in range(6):
        run = run_width(VD, w - run - xb, CAP - HS)
    slope = (w - run - xb) / (CAP - HS)
    x_at = lambda y: xb + y * slope  # noqa: E731
    d = poly((x_at(0), 0), (x_at(CAP), CAP), (x_at(CAP) + run, CAP), (x_at(0) + run, 0))
    return union(clip(d, 0, 0, w, CAP), rect(0, CAP - HS, w, CAP)), w


@glyph("eight", [0x38], SB_ROUND, SB_ROUND)
def draw_eight():
    w = 820
    upper, lower = stacked_rings(w, 388, 36, H3, VR - 6)
    return union(upper, lower), w


@glyph("nine", [0x39], SB_ROUND, SB_ROUND)
def draw_nine():
    w = 800
    return rotate180(six_shape(w), w / 2, CAP / 2), w


# ---------------------------------------------------------------- punctuation

def comma_shape():
    tail = poly((96, 120), (200, 120), (200, 40), (64, -150), (-6, -150))
    return clip(union(dot(0, 0), tail), 0, -150, 200, 200)


@glyph("space", [0x20, 0xA0], 0, 0)
def draw_space():
    return None, 300


@glyph("period", [0x2E], SB_PUNCT, SB_PUNCT)
def draw_period():
    return dot(0, 0), 200


@glyph("comma", [0x2C], SB_PUNCT, SB_PUNCT)
def draw_comma():
    return comma_shape(), 200


@glyph("colon", [0x3A], SB_PUNCT, SB_PUNCT)
def draw_colon():
    return union(dot(0, 0), dot(0, 470)), 200


@glyph("semicolon", [0x3B], SB_PUNCT, SB_PUNCT)
def draw_semicolon():
    return union(comma_shape(), dot(0, 470)), 200


@glyph("exclam", [0x21], SB_PUNCT, SB_PUNCT)
def draw_exclam():
    return union(poly((0, CAP), (200, CAP), (178, 276), (22, 276)), dot(0, 0)), 200


@glyph("question", [0x3F], SB_ROUND, SB_OPEN)
def draw_question():
    w = 720
    cx = w / 2
    y0 = 318
    cy = (y0 + CAP + OS_) / 2
    r = ring(cx, cy, cx, (CAP + OS_ - y0) / 2, VR - 6, HS)
    hook = inter(r, union(above(cy), inter(left_of(cx), above(520)), right_of(cx)))
    stem = rect(cx - V, 262, cx, y0 + HS)
    return union(hook, stem, dot(cx - V / 2 - 98, 0, 196)), w


@glyph("quotesingle", [0x27], SB_PUNCT, SB_PUNCT)
def draw_quotesingle():
    return poly((0, CAP), (170, CAP), (146, 430), (24, 430)), 170


@glyph("quotedbl", [0x22], SB_PUNCT, SB_PUNCT)
def draw_quotedbl():
    one = poly((0, CAP), (170, CAP), (146, 430), (24, 430))
    return union(one, shift(one, 230)), 400


def quote_right():
    return shift(comma_shape(), 0, CAP - 200)


def quote_left():
    return rotate180(quote_right(), 100, CAP - 175)


@glyph("quoteright", [0x2019], SB_PUNCT, SB_PUNCT)
def draw_quoteright():
    return quote_right(), 200


@glyph("quoteleft", [0x2018], SB_PUNCT, SB_PUNCT)
def draw_quoteleft():
    return quote_left(), 200


@glyph("quotedblright", [0x201D], SB_PUNCT, SB_PUNCT)
def draw_quotedblright():
    return union(quote_right(), shift(quote_right(), 250)), 450


@glyph("quotedblleft", [0x201C], SB_PUNCT, SB_PUNCT)
def draw_quotedblleft():
    return union(quote_left(), shift(quote_left(), 250)), 450


@glyph("hyphen", [0x2D], SB_PUNCT, SB_PUNCT)
def draw_hyphen():
    return rect(0, 292, 380, 292 + HS), 380


@glyph("endash", [0x2013], SB_PUNCT, SB_PUNCT)
def draw_endash():
    return rect(0, 292, 560, 292 + HS), 560


@glyph("emdash", [0x2014], 30, 30)
def draw_emdash():
    return rect(0, 292, 940, 292 + HS), 940


@glyph("ampersand", [0x26], SB_ROUND, SB_DIAG)
def draw_ampersand():
    w = 930
    m = 444
    lower = ring_box(0, -OS_, 780, m + H3 / 2, VR, H3)
    lower = diff(lower, rect(390, 300, 800, BIG))
    upper = ring_box(44, m - H3 / 2, 600, CAP + OS_, VR - 22, H3)
    leg = clip(extend_up(w - 100, 318, m, VD), 0, 0, w, m + H3 / 2 - 6)
    return union(lower, upper, leg), w


@glyph("at", [0x40], SB_ROUND, SB_ROUND)
def draw_at():
    w = 980
    cx, cy = w / 2, 330
    outer = ring(cx, cy, cx, 470, 122, 110)
    outer = diff(outer, rect(cx, cy - 100, w + 10, cy + 30))
    bx, ba = cx - 40, 232
    inner = ring(bx, cy, ba, 220, 124, 110)
    xs = bx + ba - 124
    stem = rect(xs, cy - 210, xs + 124, cy + 220)
    foot = inter(rect(xs, cy - 210, w, cy - 100), squircle(cx, cy, cx, 470))
    return union(outer, inner, stem, foot), w


@glyph("numbersign", [0x23], SB_OPEN, SB_OPEN)
def draw_numbersign():
    w = 800
    t = 140
    slant = 70
    post = lambda x: poly((x, 0), (x + slant, CAP), (x + slant + t, CAP), (x + t, 0))  # noqa: E731
    return union(post(150), post(460), rect(0, 176, w, 176 + t - 10),
                 rect(0, 414, w, 414 + t - 10)), w


@glyph("percent", [0x25], SB_ROUND, SB_ROUND)
def draw_percent():
    w = 980
    small = lambda x0, y0: ring_box(x0, y0, x0 + 330, y0 + 340, 112, 98)  # noqa: E731
    slash = clip(diag(250, -20, w - 250, CAP + 20, 140), 0, 0, w, CAP)
    return union(small(0, CAP - 340 + 8), small(w - 330, -8), slash), w


@glyph("parenleft", [0x28], SB_ROUND, SB_OPEN)
def draw_parenleft():
    return paren(), 290


@glyph("parenright", [0x29], SB_OPEN, SB_ROUND)
def draw_parenright():
    return flip_x(paren(), 145), 290


def paren():
    r = ring(500, CAP / 2, 500, 480, 172, 150, 2.3, 2.5)
    return clip(r, -10, -200, 290, 1000)


@glyph("slash", [0x2F], SB_DIAG, SB_DIAG)
def draw_slash():
    w = 520
    hw = run_width(160, w, CAP + 160) / 2
    return diag(hw, -80, w - hw, CAP + 80, 160), w


@glyph("plus", [0x2B], SB_PUNCT, SB_PUNCT)
def draw_plus():
    w = 600
    c = CAP / 2 + 6
    return union(rect(0, c - HS / 2, w, c + HS / 2), rect((w - HS) / 2 - 4, c - w / 2,
                                                            (w + HS) / 2 + 4, c + w / 2)), w


@glyph("equal", [0x3D], SB_PUNCT, SB_PUNCT)
def draw_equal():
    w = 600
    c = CAP / 2 + 6
    return union(rect(0, c - 210, w, c - 70), rect(0, c + 70, w, c + 210)), w


@glyph("asterisk", [0x2A], SB_PUNCT, SB_PUNCT)
def draw_asterisk():
    r = 220
    cx, cy = r, CAP - r
    spokes = []
    for k in range(5):
        ang = math.radians(90 + 72 * k)
        spokes.append(bar((cx, cy), (cx + r * math.cos(ang), cy + r * math.sin(ang)), 124))
    return union(*spokes), 2 * r


@glyph("periodcentered", [0xB7], SB_PUNCT, SB_PUNCT)
def draw_periodcentered():
    return dot(0, CAP / 2 + 6 - 100), 200


@glyph("multiply", [0xD7], SB_PUNCT, SB_PUNCT)
def draw_multiply():
    w = 520
    c = CAP / 2 + 6
    a = bar((0, c - w / 2), (w, c + w / 2), 150)
    b = bar((0, c + w / 2), (w, c - w / 2), 150)
    return clip(union(a, b), 0, c - w / 2, w, c + w / 2), w


@glyph("arrowright", [0x2192], SB_PUNCT, SB_PUNCT)
def draw_arrowright():
    w = 900
    c = CAP / 2 + 6
    reach = 340
    inset = 132 * math.sqrt(2)
    tip = w + 24
    outer = poly((tip, c), (tip - reach, c + reach), (tip - reach, c - reach))
    inner = poly((tip - inset, c), (tip - inset - reach, c + reach), (tip - inset - reach, c - reach))
    head = clip(diff(outer, inner), 0, -BIG, w, BIG)
    shaft = rect(0, c - HS / 2, w - inset + 60, c + HS / 2)
    return union(shaft, head), w


@glyph("dollar", [0x24], SB_ROUND, SB_ROUND)
def draw_dollar():
    w = 820
    cx = w / 2
    s = s_shape(w, 374)
    rails = union(rect(cx - 58, -120, cx + 58, 20), rect(cx - 58, CAP - 20, cx + 58, CAP + 120))
    return union(s, rails), w


@glyph("Euro", [0x20AC], SB_OPEN, SB_OPEN)
def draw_euro():
    dx = 80
    cw = 800
    cx = dx + cw / 2
    c = ring(cx, CAP / 2, cw / 2, CAP / 2 + OS_)
    c = diff(c, rect(cx, 236, dx + cw + 10, 486))
    bars = union(rect(0, 218, cx - 30, 218 + 110), rect(0, 392, cx - 30, 392 + 110))
    return union(c, bars), dx + cw


@glyph("sterling", [0xA3], SB_OPEN, SB_OPEN)
def draw_sterling():
    w = 760
    xs = 110
    y0 = 300
    a = 270
    cxr = xs + a
    cy = (y0 + CAP + OS_) / 2
    b = (CAP + OS_ - y0) / 2
    r = ring(cxr, cy, a, b, V, HS)
    hook = inter(r, union(inter(left_of(cxr), above(cy)), inter(right_of(cxr), above(540))))
    stem = rect(xs, HS - 1, xs + V, cy)
    cross = rect(20, 300, xs + V + 190, 300 + H3 - 10)
    return union(hook, stem, cross, rect(0, 0, w, HS)), w


@glyph(".notdef", [], SB_STEM, SB_STEM)
def draw_notdef():
    w = 560
    return diff(rect(0, 0, w, CAP), rect(80, 80, w - 80, CAP - 80)), w


# ---------------------------------------------------------------- kerning

KERN = {
    ("A", "V"): -70, ("A", "W"): -44, ("A", "Y"): -74, ("A", "T"): -62,
    ("V", "A"): -70, ("W", "A"): -44, ("Y", "A"): -74, ("T", "A"): -62,
    ("F", "A"): -54, ("P", "A"): -56, ("L", "T"): -96, ("L", "Y"): -90,
    ("L", "V"): -84, ("L", "W"): -54, ("A", "quoteright"): -70, ("L", "quoteright"): -96,
    ("A", "quotesingle"): -60, ("L", "quotesingle"): -86,
    ("T", "O"): -16, ("O", "T"): -16, ("Y", "O"): -24, ("O", "Y"): -24,
    ("V", "O"): -22, ("O", "V"): -22, ("O", "A"): -20, ("A", "O"): -20,
    ("A", "C"): -20, ("A", "G"): -20, ("A", "Q"): -20, ("C", "A"): -14, ("D", "A"): -20,
    ("K", "O"): -30, ("X", "O"): -26, ("R", "T"): -20, ("R", "V"): -20, ("R", "Y"): -24,
    ("T", "J"): -40, ("A", "J"): 10, ("L", "O"): -22,
}
for left in ("T", "V", "Y", "F", "P", "W"):
    amount = {"T": -84, "V": -76, "Y": -88, "F": -76, "P": -86, "W": -50}[left]
    for punct in ("period", "comma"):
        KERN[(left, punct)] = amount


def kern_feature():
    lines = ["languagesystem DFLT dflt;", "languagesystem latn dflt;", "feature kern {"]
    lines += [f"  pos {a} {b} {v};" for (a, b), v in sorted(KERN.items())]
    lines.append("} kern;")
    return "\n".join(lines)


def legacy_kern_table():
    """A format-0 'kern' table for older apps that ignore GPOS."""
    table = newTable("kern")
    table.version = 0
    sub = KernTable_format_0()
    sub.version = 0
    sub.coverage = 1
    sub.format = 0
    sub.kernTable = dict(KERN)
    table.kernTables = [sub]
    return table


# ---------------------------------------------------------------- assembly

def to_glyph(path, dx):
    pen = TTGlyphPen(None)
    if path is not None:
        clean = pathops.simplify(path, fix_winding=True, clockwise=True)
        clean.draw(TransformPen(Cu2QuPen(RoundingPen(pen), max_err=0.6, reverse_direction=False),
                                (1, 0, 0, 1, dx, 0)))
    return pen.glyph()


def draw_glyphs():
    order = [".notdef"] + [n for n in GLYPHS if n != ".notdef"]
    glyf, advances, cmap = {}, {}, {}
    for name in order:
        codepoints, fn, lsb, rsb = GLYPHS[name]
        path, width = fn()
        glyf[name] = to_glyph(path, lsb)
        advances[name] = round(lsb + width + rsb)
        for cp in codepoints:
            cmap[cp] = name
    return order, glyf, advances, cmap


def setup_names(fb):
    fb.setupNameTable({
        "copyright": COPYRIGHT,
        # Legacy IDs 1/2 stay RIBBI-safe; IDs 16/17 carry the real family and style.
        "familyName": f"{FAMILY} {STYLE}",
        "styleName": "Regular",
        "uniqueFontIdentifier": f"{FAMILY}-{STYLE};{VERSION}",
        "fullName": f"{FAMILY} {STYLE}",
        "version": f"Version {VERSION}",
        "psName": f"{FAMILY}-{STYLE}",
        "manufacturer": "ONE Agency",
        "designer": DESIGNER,
        "description": "Original display typeface for the ONE Agency rebrand, drawn from "
                       "geometric primitives in code. Not derived from any existing font.",
        "typographicFamily": FAMILY,
        "typographicSubfamily": STYLE,
    })


def setup_vertical_metrics(fb):
    glyphs = fb.font["glyf"].glyphs.values()
    y_min = min(getattr(g, "yMin", 0) for g in glyphs)
    y_max = max(getattr(g, "yMax", 0) for g in glyphs)
    fb.setupHorizontalHeader(ascent=ASCENT, descent=DESCENT, lineGap=0)
    fb.setupOS2(
        version=4, usWeightClass=800, usWidthClass=7, fsType=0, achVendID="ONEA",
        sTypoAscender=ASCENT, sTypoDescender=DESCENT, sTypoLineGap=0,
        usWinAscent=max(ASCENT, y_max), usWinDescent=max(-DESCENT, -y_min),
        sxHeight=CAP, sCapHeight=CAP,  # unicase: lowercase shares the caps
        fsSelection=0x0080 | 0x0040,  # USE_TYPO_METRICS | REGULAR
        # Basic Latin, Latin-1, General Punctuation | Currency Symbols, Arrows
        ulUnicodeRange1=0b11 | 1 << 31, ulUnicodeRange2=1 << 1 | 1 << 5, ulCodePageRange1=1,
    )


def build_font():
    order, glyf, advances, cmap = draw_glyphs()
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyf)
    table = fb.font["glyf"]
    for name in order:
        table[name].recalcBounds(table)
    fb.setupHorizontalMetrics({n: (advances[n], getattr(table[n], "xMin", 0)) for n in order})
    setup_vertical_metrics(fb)
    setup_names(fb)
    fb.font["head"].fontRevision = float(VERSION)
    fb.setupPost(isFixedPitch=0, underlinePosition=-120, underlineThickness=80)
    fb.addOpenTypeFeatures(kern_feature())
    fb.font["kern"] = legacy_kern_table()
    return fb.font, len(order), len(cmap)


def save_font(font):
    os.makedirs(OUT_DIR, exist_ok=True)
    ttf = os.path.join(OUT_DIR, f"{FAMILY}.ttf")
    font.save(ttf)
    font.flavor = "woff2"
    font.save(os.path.join(OUT_DIR, f"{FAMILY}.woff2"))
    return ttf


# ---------------------------------------------------------------- specimen

SPEC_W = 2400
SPEC_PAD = 120
PAPER = "#f4f6ef"
INK = "#0a0a0a"
MUTED = "#4d5446"
RULE = "#d7dbcf"
ACCENT = "#e1fe03"
SPECIMEN_CHARS = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    ".,:;!?'\"\u2018\u2019\u201c\u201d-\u2013\u2014&@#%()/+=*\u00b7\u00d7\u2192$\u20ac\u00a3"
)
WATERFALL = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG. 0 + 1 = 1"
MEASURE = SPEC_W - 2 * SPEC_PAD


def fitted(face, text, size, width=MEASURE):
    """Largest size up to `size` at which text fits the given width."""
    while face(size).getlength(text) > width:
        size -= 2
    return face(size)


def fitted_text(face, text, size, width):
    """Trim text at a word boundary so it fits the width at the given size."""
    words = text.split(" ")
    while len(words) > 1 and face(size).getlength(" ".join(words)) > width:
        words.pop()
    return " ".join(words)


def specimen_header(draw, face, top):
    draw.rectangle([0, top, SPEC_W, top + 760], fill=INK)
    draw.text((SPEC_PAD, top + 110), "ONE AGENCY / DISPLAY TYPE", font=face(30), fill=PAPER, anchor="ls")
    draw.text((SPEC_W - SPEC_PAD, top + 110), "EXTRABOLD 800", font=face(30), fill=PAPER, anchor="rs")
    draw.text((SPEC_PAD - 10, top + 560), "ONE-DVG", font=fitted(face, "ONE-DVG", 380), fill=PAPER,
              anchor="ls")
    draw.rectangle([SPEC_PAD, top + 650, SPEC_PAD + 220, top + 666], fill=ACCENT)
    draw.text((SPEC_W - SPEC_PAD, top + 666), "WIDE GEOMETRIC GROTESK. UNICASE.", font=face(30),
              fill=PAPER, anchor="rs")
    return top + 760


def specimen_hero(draw, face, top):
    draw.text((SPEC_PAD - 14, top + 380), "ONE AGENCY", font=fitted(face, "ONE AGENCY", 300), fill=INK,
              anchor="ls")
    top += 480
    draw.rectangle([0, top, SPEC_W, top + 300], fill=ACCENT)
    draw.text((SPEC_PAD, top + 200), "INTENT IN. REVENUE OUT.", font=face(132), fill=INK, anchor="ls")
    return top + 300


def specimen_grid(draw, face, top, cols=12):
    cell_w = (SPEC_W - 2 * SPEC_PAD) / cols
    cell_h = 230
    glyph_face = face(130)
    label = face(16)
    top += 110
    draw.text((SPEC_PAD, top - 30), f"CHARACTER SET / {len(SPECIMEN_CHARS)} CHARACTERS. UNICASE: LOWERCASE KEYS SHARE THE CAPS",
              font=face(26), fill=MUTED, anchor="ls")
    for i, ch in enumerate(SPECIMEN_CHARS):
        x = SPEC_PAD + (i % cols) * cell_w
        y = top + (i // cols) * cell_h
        draw.rectangle([x, y, x + cell_w, y + cell_h], outline=RULE, width=2)
        draw.text((x + 14, y + 26), f"{ord(ch):04X}", font=label, fill=MUTED, anchor="ls")
        draw.text((x + cell_w / 2, y + 170), ch, font=glyph_face, fill=INK, anchor="ms")
    rows = (len(SPECIMEN_CHARS) + cols - 1) // cols
    return top + rows * cell_h


def specimen_equation(draw, face, top):
    top += 60
    draw.text((SPEC_PAD - 10, top + 300), "0 + 1 = 1", font=face(300), fill=INK, anchor="ls")
    facts = ["UNITS PER EM 1000", "CAP HEIGHT 720", "STEM 180 / BAR 150",
             "OVERSHOOT 14", "ASCENT 950 / DESCENT 250"]
    for i, fact in enumerate(facts):
        draw.text((SPEC_W - SPEC_PAD, top + 90 + i * 52), fact, font=face(28), fill=MUTED, anchor="rs")
    return top + 380


def specimen_waterfall(draw, face, top):
    top += 40
    draw.line([SPEC_PAD, top, SPEC_W - SPEC_PAD, top], fill=RULE, width=2)
    for size in (16, 24, 40, 64, 96):
        top += int(size * 1.25) + 40
        draw.text((SPEC_PAD, top), f"{size}", font=face(20), fill=MUTED, anchor="ls")
        line = fitted_text(face, WATERFALL, size, MEASURE - 90)
        draw.text((SPEC_PAD + 90, top), line, font=face(size), fill=INK, anchor="ls")
    return top + 60


def specimen_footer(draw, face, top):
    draw.rectangle([0, top, SPEC_W, top + 150], fill=INK)
    draw.text((SPEC_PAD, top + 88), "2026 ONE AGENCY. ORIGINAL DESIGN.", font=face(26), fill=PAPER,
              anchor="ls")
    draw.text((SPEC_W - SPEC_PAD, top + 88), "DESIGNED BY DVG. DRAWN FROM GEOMETRIC PRIMITIVES.",
              font=face(26), fill=PAPER, anchor="rs")
    return top + 150


def render_specimen(ttf, out):
    from PIL import Image, ImageDraw, ImageFont

    def face(size):
        return ImageFont.truetype(ttf, size)

    img = Image.new("RGB", (SPEC_W, 4300), PAPER)
    draw = ImageDraw.Draw(img)
    top = 0
    for section in (specimen_header, specimen_hero, specimen_grid, specimen_equation,
                    specimen_waterfall, specimen_footer):
        top = section(draw, face, top)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.crop((0, 0, SPEC_W, top)).save(out, optimize=True)


def main():
    font, glyph_count, codepoint_count = build_font()
    ttf = save_font(font)
    print(f"{glyph_count} glyphs, {codepoint_count} codepoints -> {ttf} (+ .woff2)")
    render_specimen(ttf, SPECIMEN)
    print(f"specimen -> {SPECIMEN}")


if __name__ == "__main__":
    main()
