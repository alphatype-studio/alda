# Alda Format Specification — v0.1

> Status: Draft
> License: CC BY 4.0
> © 2025 Alphatype

---

## Overview

**Alda** is an open file format for skeleton-based motion fonts.
Extension: `.alda` · Encoding: UTF-8 JSON · Version: `0.1`

| Format | Structure | Motion | Skeleton | Brush |
|---|---|---|---|---|
| TTF / OTF | Outline | ❌ | ❌ | ❌ |
| Variable Font | Axis interpolation | Partial | ❌ | ❌ |
| SVG Font | SVG path | Limited | ❌ | ❌ |
| **Alda** | **Skeleton + Brush** | **✅** | **✅** | **✅** |

### Design principles

- **Non-destructive** — original skeleton is always preserved; FX apply only at render time
- **Web-native** — JSON-based, renderable in the browser with JS alone
- **Fully open** — format spec is CC BY 4.0; anyone may implement it
- **Services separate** — Alphatype editor/platform is commercial

---

## Top-level structure

```json
{
  "alda": "0.1",
  "meta": { ... },
  "glyphs": [ ... ],
  "animations": [ ... ],
  "fx": [ ... ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `alda` | string | ✅ | Format version |
| `meta` | object | ✅ | Font metadata |
| `glyphs` | array | | Glyph definitions |
| `animations` | array | | Named animation sequences |
| `fx` | array | | Non-destructive effect stack |

---

## meta

```json
"meta": {
  "name": "Single Day",
  "upm": 1000,
  "ascender": 800,
  "descender": -200,
  "author": "Alphatype",
  "version": "1.0.0",
  "license": "OFL-1.1",
  "created": "2025-03-25"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Font name |
| `upm` | number | ✅ | Units Per Em (default 1000) |
| `ascender` | number | ✅ | Ascender height |
| `descender` | number | ✅ | Descender (negative) |
| `version` | string | | semver |
| `author` | string | | Creator |
| `license` | string | | SPDX identifier |
| `created` | string | | ISO 8601 date |

---

## glyphs

Each glyph represents one Unicode codepoint.

```json
{
  "unicode": "AC00",
  "name": "가",
  "advance": 550,
  "skeleton": [ ... ],
  "brush": { ... },
  "anchors": { ... }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `unicode` | string | ✅ | Hex codepoint, e.g. `"AC00"` |
| `advance` | number | ✅ | Advance width |
| `skeleton` | array | ✅ | Stroke array |
| `name` | string | | Human-readable name |
| `brush` | object | | Elliptical brush parameters |
| `anchors` | object | | Connection anchors |

### skeleton — stroke array

```json
{
  "id": "stroke-0",
  "points": [
    { "x": 275, "y": 750, "type": "move" },
    { "x": 275, "y": 50,  "type": "line" },
    {
      "x": 350, "y": 400,
      "cp1": { "x": 100, "y": 300 },
      "cp2": { "x": 300, "y": 400 },
      "type": "curve"
    }
  ],
  "closed": false,
  "width_profile": [30, 28, 25, 28, 30]
}
```

| Point type | Description |
|---|---|
| `move` | Start point (pen up) |
| `line` | Straight line segment |
| `curve` | Cubic Bézier — `cp1`, `cp2` required |

`width_profile`: per-interval stroke width, normalized 0–100.
Number of values = number of points − 1.
Interpolated linearly between sample positions.

### brush

```json
{ "rx": 14, "ry": 6, "angle": -0.3, "roundness": 43 }
```

| Field | Description |
|---|---|
| `rx` | Semi-major axis |
| `ry` | Semi-minor axis |
| `angle` | Tilt in radians |
| `roundness` | `ry/rx × 100` % — same concept as Illustrator Roundness |

Key formulas:

```
S = √(rx × ry)        // size scalar (geometric mean)
ratio = ry / rx        // flatness ratio
ry = S² / rx           // recover ry when S is fixed
```

- Size handle → change S only, ratio and angle preserved
- Proportion + angle handle → change rx and angle, keep S → ry = S²/rx

### anchors

```json
{
  "entry":  { "x": 275, "y": 750 },
  "exit":   { "x": 275, "y": 50  },
  "top":    { "x": 275, "y": 800 },
  "bottom": { "x": 275, "y": 0   }
}
```

Used for Hangul jamo composition and ligature connections.
Extended anchor names will be defined in v0.2.

---

## animations

```json
{
  "id": "write",
  "label": "쓰기",
  "duration": 1.0,
  "loop": false,
  "tracks": [
    {
      "target": "stroke-0",
      "property": "stroke_progress",
      "keyframes": [
        { "t": 0.0, "value": 0.0, "easing": "linear" },
        { "t": 1.0, "value": 1.0, "easing": "ease-out" }
      ]
    }
  ]
}
```

### Animatable properties

| Property | Description |
|---|---|
| `stroke_progress` | Drawing progress 0.0–1.0 |
| `brush.rx` | Brush semi-major axis |
| `brush.ry` | Brush semi-minor axis |
| `brush.angle` | Brush tilt |
| `opacity` | Alpha 0.0–1.0 |
| `offset.x` / `offset.y` | Position translation |

### Easing

`linear` `ease-in` `ease-out` `ease-in-out` `spring`

---

## fx

Non-destructive effects. Applied only at render/export time.
Original skeleton is always preserved.

```json
{
  "id": "fx-0",
  "type": "warp",
  "enabled": true,
  "params": { "strength": 0.4, "frequency": 2.0 }
}
```

### Supported types (v0.1)

| Type | Description |
|---|---|
| `warp` | Path distortion |
| `outline` | Add stroke outline |
| `shadow` | Drop shadow |
| `roughen` | Roughen edges |
| `union` | Merge overlapping paths (for export cleanup) |

FX is visible in the UI when in **Preview** or **Font** editor mode.

---

## Export options

`.alda` → `.ttf` / `.otf` / `.svg`:

```json
{
  "export": {
    "format": "ttf",
    "apply_fx": true,
    "union_paths": true,
    "simplify_tolerance": 1.0,
    "subset": "ks-2350"
  }
}
```

| Option | Description |
|---|---|
| `apply_fx` | Bake enabled FX into outlines |
| `union_paths` | Merge overlapping paths |
| `simplify_tolerance` | Path simplification tolerance (0 = off) |
| `subset` | Unicode subset: `ks-2350` / `latin` / `full` |

Subset reference:
- `ks-2350` — KS X 1001 standard Korean 2,350 characters (web font recommended)
- `latin` — ASCII 95 characters (U+0020–U+007E)
- `full` — All glyphs

---

## JSON Schema

Machine-readable validation schema: [`schema.json`](./schema.json)

---

## Versioning

This document describes **Alda v0.1 (Draft)**.
Changes are tracked in [`CHANGELOG.md`](./CHANGELOG.md).

Backwards compatibility guarantees begin at v1.0.

---

*Alda Format Specification © 2025 Alphatype — CC BY 4.0*
