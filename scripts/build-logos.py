"""Cut the Figma moodboard exports in design/figma-exports/boards into transparent, tightly cropped
logo files per concept, slot and colour mode. Run: python3 scripts/build-logos.py

Element ids are Figma layer names. Light files keep the board's colours; dark files are recoloured
to read on the concept's dark hero background. Fills are written as uppercase hex so the app can
recolour marks with a plain string map (see src/lib/logos.ts)."""
import copy
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from svgbox import ET, NS, elem_bbox, path_bbox, union  # noqa: E402

SRC = "design/figma-exports/boards"
OUT = "src/assets/logos"
KEYWORDS = {"BLACK": "#000000", "WHITE": "#FFFFFF"}
_cache = {}


def load(board):
    if board not in _cache:
        root = ET.parse(os.path.join(SRC, f"{board}.svg")).getroot()
        frame = next(g for g in root if g.tag == NS + "g" and g.get("id") == board)
        defs = root.find(NS + "defs")
        _cache[board] = ({el.get("id"): el for el in frame.iter() if el.get("id")},
                         {d.get("id"): d for d in (defs if defs is not None else [])})
    return _cache[board]


def norm(v):
    v = v.strip().upper()
    return KEYWORDS.get(v, v)


def paint(el, cmap, overrides):
    """Normalise colour keywords, apply the colour map, then per-id attribute overrides."""
    for node in el.iter():
        for attr in ("fill", "stroke", "stop-color"):
            v = node.get(attr)
            if v and not v.startswith("url(") and v != "none":
                v = norm(v)
                node.set(attr, cmap.get(v, v))
        for attr, v in overrides.get(node.get("id"), {}).items():
            node.set(attr, v)


def strip(el):
    """Drop Figma frame clips (they match the artwork bounds) and layer ids from the output."""
    for node in el.iter():
        node.attrib.pop("clip-path", None)
        node.attrib.pop("id", None)


def peel(el, max_x):
    """Split the subpaths that end left of max_x (a single letter) into their own path, id "<id> peel"."""
    subs = re.split(r"(?=M)", el.get("d"))
    left = [d for d in subs if d and path_bbox(d)[2] <= max_x]
    rest = [d for d in subs if d and path_bbox(d)[2] > max_x]
    letter = copy.deepcopy(el)
    letter.set("d", "".join(left))
    letter.set("id", f"{el.get('id')} peel")
    el.set("d", "".join(rest))
    return [el, letter]


def build(path, board, ids, cmap=None, overrides=None, peels=None):
    """cmap: {colour: colour} applied to every element. overrides: {layer id: {attr: value}}.
    peels: {layer id: max x}, see peel(); the split-off letter is addressable in overrides."""
    cmap = {norm(k): v for k, v in (cmap or {}).items()}
    overrides = overrides or {}
    els, defs = load(board)
    parts = []
    for i in ids:
        el = copy.deepcopy(els[i])
        parts += peel(el, peels[i]) if peels and i in peels else [el]
    for p in parts:
        paint(p, cmap, overrides)
    x0, y0, x1, y1 = union([elem_bbox(p) for p in parts])
    w, h = x1 - x0, y1 - y0
    svg = ET.Element(NS + "svg", {"width": f"{w:.2f}", "height": f"{h:.2f}",
                                  "viewBox": f"{x0:.2f} {y0:.2f} {w:.2f} {h:.2f}", "fill": "none"})
    prefix = path.replace("/", "-").removesuffix(".svg")
    refs = {}
    for p in parts:
        for node in p.iter():
            m = re.match(r"url\(#(.+)\)", node.get("fill", ""))
            if m:
                refs.setdefault(m.group(1), f"{prefix}-{len(refs)}")
                node.set("fill", f"url(#{refs[m.group(1)]})")
    if refs:
        d = ET.SubElement(svg, NS + "defs")
        for old, new in refs.items():
            g = copy.deepcopy(defs[old])
            paint(g, cmap, {})
            g.set("id", new)
            d.append(g)
    for p in parts:
        strip(p)
        svg.append(p)
    os.makedirs(os.path.dirname(os.path.join(OUT, path)), exist_ok=True)
    ET.ElementTree(svg).write(os.path.join(OUT, path), encoding="unicode")
    print(f"{path:26} {w:8.1f} x {h:7.1f}")


def pair(stem, board, ids, light=None, dark=None, dark_ids=None):
    """Write <stem>-light.svg and <stem>-dark.svg. light/dark: {"cmap": ..., "overrides": ...}."""
    build(f"{stem}-light.svg", board, ids, **(light or {}))
    build(f"{stem}-dark.svg", board, dark_ids or ids, **(dark or {}))


WHITE = "#FFFFFF"

# Nova (board nova): a rounded O with one square corner, sharing its right side with the N, and a wide lowercase agency.
# The board (Figma frame "ONE Agency — Rebrand Moodboard", node 120:726) draws a light lockup, a reversed one on plum
# and the light mark. Primary is the horizontal lockup, alt the ONE alone; the dark files use the reversed artwork.
# The two shading rects darken the N where it meets the O and the E.
NOVA_ONE = ["one", "Subtract_2", "Rectangle 96", "Rectangle 97", "Subtract_7"]
NOVA_ONE_DARK = ["one_2", "Subtract_12", "Rectangle 100_2", "Rectangle 101", "Subtract_13"]
pair("nova/primary", "nova", NOVA_ONE + ["Group 19"], dark_ids=NOVA_ONE_DARK + ["Group 22"])
pair("nova/alt", "nova", NOVA_ONE, dark_ids=NOVA_ONE_DARK)
pair("nova/mark", "nova", ["Subtract"], dark_ids=["Subtract_12"])

# Volt (board v1): stencil ONE with a 1 cut inside the O. Cut from the lime box lockup, all black on the board.
VOLT_LIME = {"cmap": {"#000000": "#E1FE03"}}
VOLT_ONE = ["Subtract_8", "Subtract_7", "Union_2"]
pair("volt/primary", "v1", VOLT_ONE + ["agency_2"], dark=VOLT_LIME)
pair("volt/alt", "v1", VOLT_ONE, dark=VOLT_LIME)
pair("volt/mark", "v1", ["Subtract_2"], dark=VOLT_LIME)

# Pill (board v3): gradient capsule O + NE. The board draws its own reversed artwork on deep plum boxes.
pair("pill/primary", "v3", ["one_2", "one_4", "one_6", "agency_2"], dark_ids=["one", "one_3", "one_5", "agency"])
pair("pill/alt", "v3", ["one_7", "one_9", "one_11", "agency_3"], dark_ids=["one_8", "one_10", "one_12", "agency_4"])
pair("pill/mark", "v3", ["one_2"], dark_ids=["one"])

# Arc (board v4): the boxed lockup is the dark original (yellow over pink), the horizontal one the light original.
pair("arc/primary", "v4", ["Subtract_2", "Subtract", "one", "agency"],
     light={"overrides": {"Subtract_2": {"fill": "#FF1F71"}, "Subtract": {"fill": "#0C0E09"},
                          "one": {"fill": "#0C0E09"}, "agency": {"fill": "#FF1F71"}}})
pair("arc/alt", "v4", ["Group 5", "one_2", "agency_2"], light={"cmap": {"#000000": "#0C0E09"}},
     dark={"overrides": {"Subtract_4": {"fill": "#FBFF19"}, "Subtract_3": {"fill": "#FF1F71"}, "one_2": {"fill": WHITE}}})
pair("arc/mark", "v4", ["Group 6"], dark_ids=["Subtract_2", "Subtract"])
