# @alphatype/alda-js

Parser and utilities for the [Alda](https://github.com/alphatype/alda) skeleton motion font format.

[![npm version](https://img.shields.io/npm/v/@alphatype/alda-js)](https://www.npmjs.com/package/@alphatype/alda-js)
[![license](https://img.shields.io/npm/l/@alphatype/alda-js)](LICENSE)

## Install

```bash
npm install @alphatype/alda-js
```

Or use via CDN (no install needed):

```html
<script src="https://cdn.jsdelivr.net/npm/@alphatype/alda-js/src/index.js"></script>
```

## Quick Start

```js
import Alda from '@alphatype/alda-js'

const font = Alda.load(aldaJsonString)  // → AldaFont

// Look up a glyph
const glyph = font.getGlyphByChar('가')
console.log(glyph.skeleton)  // stroke array

// Play animation
const anim = font.getAnimation('write')
console.log(anim.tracks)

// Active FX
console.log(font.getEnabledFx())
```

## API

### `Alda.load(jsonStringOrObject) → AldaFont`

Parse and validate an Alda document. Throws `TypeError` with a list of validation errors if the document is invalid.

### `Alda.isValid(data) → boolean`

Returns `true` if `data` is a structurally valid Alda document.

### `AldaFont`

| Method | Returns | Description |
|---|---|---|
| `.getGlyph(unicode)` | `AldaGlyph \| null` | Look up by hex codepoint e.g. `'AC00'` |
| `.getGlyphByChar(char)` | `AldaGlyph \| null` | Look up by character e.g. `'가'` |
| `.getAnimation(id)` | `AldaAnimation \| null` | Look up animation by id |
| `.getEnabledFx()` | `AldaFx[]` | All FX with `enabled: true` |
| `.toJSON()` | `string` | Serialize back to `.alda` JSON |
| `.meta` | `AldaMeta` | Font metadata |
| `.glyphs` | `AldaGlyph[]` | All glyphs |
| `.animations` | `AldaAnimation[]` | All animations |
| `.fx` | `AldaFx[]` | All FX |

### `Alda.brush`

Brush math utilities based on the elliptical brush model `S = √(rx × ry)`.

| Method | Description |
|---|---|
| `.computeS(rx, ry)` | `S = √(rx·ry)` — geometric mean (size scalar) |
| `.computeRy(S, rx)` | `ry = S²/rx` — recover ry when S is fixed |
| `.computeRoundness(rx, ry)` | `(ry/rx)×100` — roundness % |
| `.scale(brush, factor)` | Scale brush preserving ratio and angle |
| `.normalize(brush?)` | Fill missing fields with defaults |

## Format

See [spec/alda-spec-v0.1.md](../spec/alda-spec-v0.1.md) for the full format specification.

A minimal `.alda` file:

```json
{
  "alda": "0.1",
  "meta": {
    "name": "My Font",
    "upm": 1000,
    "ascender": 800,
    "descender": -200
  },
  "glyphs": [
    {
      "unicode": "AC00",
      "name": "가",
      "advance": 550,
      "skeleton": [
        {
          "id": "stroke-0",
          "points": [
            { "x": 275, "y": 750, "type": "move" },
            { "x": 275, "y": 50,  "type": "line" }
          ],
          "width_profile": [30, 25]
        }
      ],
      "brush": { "rx": 14, "ry": 6, "angle": -0.3, "roundness": 43 }
    }
  ]
}
```

## License

MIT © Alphatype
