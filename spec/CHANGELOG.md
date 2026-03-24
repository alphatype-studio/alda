# Changelog

All notable changes to the Alda format specification are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.1.0] — 2025-03-25

### Added
- Initial draft specification
- `meta` block: name, upm, ascender, descender, author, version, license, created
- `glyphs` array with skeleton strokes (move/line/curve points), brush, anchors
- `animations` with per-track keyframe system
- Animatable properties: stroke_progress, brush.rx/ry/angle, opacity, offset.x/y
- `fx` stack: warp, outline, shadow, roughen, union
- Brush ellipse math: S = √(rx·ry), roundness = ry/rx×100
- Export options: format, apply_fx, union_paths, simplify_tolerance, subset
- JSON Schema (Draft 7)
- `@alphatype/alda-js` v0.1.0 reference implementation

---

## Planned

### [0.2.0]
- Hangul jamo composition anchor system (choseong/jungseong/jongseong)
- Extended anchor names for ligature connections
- `@alphatype/alda-cli` TTF → .alda converter

### [0.3.0]
- Binary compressed format `.aldab`
- Variable font axes support

### [1.0.0]
- Stability guarantee — no breaking changes after this release
