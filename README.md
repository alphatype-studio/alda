# Alda

**Open format for skeleton-based motion fonts.**

`.alda` — the font format that moves.

[![spec](https://img.shields.io/badge/spec-v0.1%20draft-blue)](spec/alda-spec-v0.1.md)
[![npm](https://img.shields.io/npm/v/@alphatype/alda-js)](https://www.npmjs.com/package/@alphatype/alda-js)
[![license spec](https://img.shields.io/badge/spec%20license-CC%20BY%204.0-lightgrey)](LICENSE-SPEC)
[![license code](https://img.shields.io/badge/code%20license-MIT-green)](LICENSE)

---

## What is Alda?

Existing font formats (TTF, OTF, Variable Fonts) store static outlines.
**Alda** stores the *skeleton* — the structural backbone of a stroke — together with a brush shape and animation data.

| | TTF/OTF | Variable Font | **Alda** |
|---|---|---|---|
| Structure | Outline | Axis interpolation | **Skeleton + Brush** |
| Motion | ❌ | Partial | **✅** |
| Skeleton | ❌ | ❌ | **✅** |
| Brush | ❌ | ❌ | **✅** |
| Web-native | Requires loader | Requires loader | **JSON, zero deps** |

### Name

```
Al  ← Alpha (Alphatype)
d   ← Dynamic / Dynamis (Greek: potential, power)
a   ← Animate

한국어 "알다(知)" — the font that learns
```

---

## Quick Start

```bash
npm install @alphatype/alda-js
```

```js
import Alda from '@alphatype/alda-js'

const font = Alda.load(aldaJsonString)

const glyph = font.getGlyphByChar('가')
console.log(glyph.skeleton)         // stroke array

const anim  = font.getAnimation('write')
console.log(anim.tracks)            // keyframe tracks
```

Or in the browser without a bundler:

```html
<script src="https://cdn.jsdelivr.net/npm/@alphatype/alda-js/src/index.js"></script>
<script>
  const font = Alda.load(json)
</script>
```

---

## Repository structure

```
alda/
  README.md
  spec/
    alda-spec-v0.1.md     ← Format specification (CC BY 4.0)
    schema.json           ← JSON Schema Draft 7
    CHANGELOG.md
  alda-js/                ← @alphatype/alda-js (MIT)
    src/
    test/
    package.json
    README.md
  examples/
    hello-world.alda      ← Minimal sample font
  tools/                  ← Converters (coming soon)
  CONTRIBUTING.md
  RFC/                    ← Format proposals
```

---

## Specification

The format spec is in [`spec/alda-spec-v0.1.md`](spec/alda-spec-v0.1.md) and licensed under **CC BY 4.0** — you may implement it in any language or product.

A JSON Schema for machine validation is at [`spec/schema.json`](spec/schema.json).

---

## Business model

```
Free (open)                     Paid (service)
────────────────────────        ──────────────────────────
.alda format spec          →    Alphatype font editor
@alphatype/alda-js         →    Cloud storage & sharing
Parser library             →    Team collaboration
                                Commercial font assets
                                Custom font commissions
```

Strategy: like [Lottie](https://lottiefiles.com/) — the more the format spreads, the more demand grows for Alphatype tools.

---

## Roadmap

**v0.1 (now)** — Parser, brush utils, JSON Schema, sample files
**v0.1.x** — `render()` canvas renderer, `play()` animation, `<alda-text>` web component
**v0.2** — Hangul jamo anchor system, `alda-cli` TTF→.alda converter
**v0.3** — Binary `.aldab`, Figma plugin
**v1.0** — Stability guarantee

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
Format proposals go in [RFC/](RFC/).

---

## License

- Format specification: **CC BY 4.0** — see [LICENSE-SPEC](LICENSE-SPEC)
- Code (`alda-js` and tools): **MIT** — see [LICENSE](LICENSE)

© 2025 Alphatype
