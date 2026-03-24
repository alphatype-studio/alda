'use strict';

const Alda = require('../src/index.js');

// ── Minimal test runner ─────────────────────────────────────
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}
function assert(cond, msg) { if (!cond) throw new Error(msg ?? 'Assertion failed'); }
function assertEqual(a, b) { if (a !== b) throw new Error(`Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function assertThrows(fn, type) {
  try { fn(); throw new Error('Expected to throw'); }
  catch (e) { if (type && !(e instanceof type)) throw new Error(`Expected ${type.name}, got ${e.constructor.name}: ${e.message}`); }
}

// ── Fixtures ────────────────────────────────────────────────
const MINIMAL = {
  alda: '0.1',
  meta: { name: 'Test', upm: 1000, ascender: 800, descender: -200 },
};

const FULL = {
  alda: '0.1',
  meta: { name: 'Single Day', author: 'Alphatype', version: '1.0.0',
          upm: 1000, ascender: 800, descender: -200, license: 'OFL-1.1' },
  glyphs: [{
    unicode: 'AC00', name: '가', advance: 550,
    skeleton: [{
      id: 'stroke-0',
      points: [
        { x: 275, y: 750, type: 'move' },
        { x: 275, y: 50,  type: 'line' },
      ],
      closed: false,
      width_profile: [30, 28, 25],
    }],
    brush: { rx: 14, ry: 6, angle: -0.3, roundness: 43 },
    anchors: { entry: { x: 275, y: 750 }, exit: { x: 275, y: 50 } },
  }],
  animations: [{
    id: 'write', label: '쓰기', duration: 1.0, loop: false,
    tracks: [{
      target: 'stroke-0', property: 'stroke_progress',
      keyframes: [
        { t: 0.0, value: 0.0, easing: 'linear' },
        { t: 1.0, value: 1.0, easing: 'ease-out' },
      ],
    }],
  }],
  fx: [{ id: 'fx-0', type: 'warp', enabled: true, params: { strength: 0.4 } }],
};

// ── Tests ────────────────────────────────────────────────────
console.log('\n@alphatype/alda-js test suite\n');

console.log('load()');
test('parses JSON string', () => {
  const font = Alda.load(JSON.stringify(MINIMAL));
  assertEqual(font.version, '0.1');
});
test('parses plain object', () => {
  const font = Alda.load(MINIMAL);
  assertEqual(font.meta.name, 'Test');
});
test('parses full document', () => {
  const font = Alda.load(FULL);
  assertEqual(font.glyphs.length, 1);
  assertEqual(font.animations.length, 1);
  assertEqual(font.fx.length, 1);
});
test('throws SyntaxError on invalid JSON string', () => {
  assertThrows(() => Alda.load('{bad json'), SyntaxError);
});
test('throws TypeError when alda field missing', () => {
  assertThrows(() => Alda.load({ meta: MINIMAL.meta }), TypeError);
});
test('throws TypeError when meta missing', () => {
  assertThrows(() => Alda.load({ alda: '0.1' }), TypeError);
});
test('throws TypeError when meta.upm missing', () => {
  assertThrows(() => Alda.load({ alda: '0.1', meta: { name: 'X', ascender: 800, descender: -200 } }), TypeError);
});

console.log('\nAldaFont.getGlyph()');
test('returns glyph by uppercase unicode', () => {
  const font = Alda.load(FULL);
  assert(font.getGlyph('AC00') !== null, 'expected glyph');
  assertEqual(font.getGlyph('AC00').name, '가');
});
test('is case-insensitive', () => {
  const font = Alda.load(FULL);
  assert(font.getGlyph('ac00') !== null);
});
test('returns null for missing glyph', () => {
  const font = Alda.load(FULL);
  assertEqual(font.getGlyph('0000'), null);
});

console.log('\nAldaFont.getGlyphByChar()');
test('returns glyph by character', () => {
  const font = Alda.load(FULL);
  assert(font.getGlyphByChar('가') !== null);
});
test('returns null for missing char', () => {
  const font = Alda.load(FULL);
  assertEqual(font.getGlyphByChar('Z'), null);
});

console.log('\nAldaFont.getAnimation()');
test('returns animation by id', () => {
  const font = Alda.load(FULL);
  const anim = font.getAnimation('write');
  assert(anim !== null);
  assertEqual(anim.duration, 1.0);
});
test('returns null for missing animation', () => {
  const font = Alda.load(FULL);
  assertEqual(font.getAnimation('unknown'), null);
});

console.log('\nAldaFont.getEnabledFx()');
test('returns only enabled fx', () => {
  const doc = { ...FULL, fx: [
    { id: 'a', type: 'warp', enabled: true, params: {} },
    { id: 'b', type: 'outline', enabled: false, params: {} },
  ]};
  const font = Alda.load(doc);
  const enabled = font.getEnabledFx();
  assertEqual(enabled.length, 1);
  assertEqual(enabled[0].id, 'a');
});

console.log('\nAldaFont.toJSON()');
test('round-trips JSON', () => {
  const font = Alda.load(FULL);
  const json = font.toJSON();
  const font2 = Alda.load(json);
  assertEqual(font2.meta.name, 'Single Day');
});

console.log('\nisValid()');
test('returns true for valid document', () => {
  assert(Alda.isValid(MINIMAL) === true);
});
test('returns false for invalid document', () => {
  assert(Alda.isValid({ alda: '0.1' }) === false);
});
test('returns false for null', () => {
  assert(Alda.isValid(null) === false);
});

console.log('\nbrush utilities');
test('computeS returns geometric mean', () => {
  const s = Alda.brush.computeS(16, 4);
  assertEqual(s, 8);
});
test('computeRy recovers ry from S and rx', () => {
  const ry = Alda.brush.computeRy(8, 16);
  assertEqual(ry, 4);
});
test('computeRoundness returns percentage', () => {
  const r = Alda.brush.computeRoundness(14, 6);
  assert(Math.abs(r - (6 / 14 * 100)) < 0.001);
});
test('scale multiplies rx and ry', () => {
  const b = Alda.brush.scale({ rx: 10, ry: 5, angle: 0 }, 2);
  assertEqual(b.rx, 20);
  assertEqual(b.ry, 10);
  assertEqual(b.angle, 0);
});
test('normalize fills missing fields', () => {
  const b = Alda.brush.normalize({});
  assert(b.rx > 0 && b.ry > 0);
  assert(typeof b.angle === 'number');
  assert(typeof b.roundness === 'number');
});

console.log('\ninterpolateKeyframes()');
test('returns start value before first keyframe', () => {
  const kf = [{ t: 0.2, value: 0.5 }, { t: 0.8, value: 1.0 }];
  assertEqual(Alda.interpolateKeyframes(kf, 0.0), 0.5);
});
test('returns end value after last keyframe', () => {
  const kf = [{ t: 0.0, value: 0.0 }, { t: 1.0, value: 1.0 }];
  assertEqual(Alda.interpolateKeyframes(kf, 1.0), 1.0);
});
test('interpolates linearly between keyframes', () => {
  const kf = [{ t: 0.0, value: 0.0 }, { t: 1.0, value: 1.0 }];
  const mid = Alda.interpolateKeyframes(kf, 0.5);
  assert(Math.abs(mid - 0.5) < 0.0001, `expected 0.5, got ${mid}`);
});
test('returns 1 for empty keyframe array', () => {
  assertEqual(Alda.interpolateKeyframes([], 0.5), 1);
});

console.log('\nbuildStrokeProgress()');
test('produces progress map from animation tracks', () => {
  const font = Alda.load(FULL);
  const anim = font.getAnimation('write');
  // At t=0.5 with linear kf [0→1], progress should be ~0.5
  const sp = Alda.buildStrokeProgress(anim, 0.5);
  assert(typeof sp['stroke-0'] === 'number', 'expected number for stroke-0');
  assert(Math.abs(sp['stroke-0'] - 0.5) < 0.0001, `expected ~0.5, got ${sp['stroke-0']}`);
});
test('ignores non-progress properties', () => {
  const anim = {
    id: 'x', duration: 1, tracks: [
      { target: 's0', property: 'opacity', keyframes: [{ t: 0, value: 0 }, { t: 1, value: 1 }] },
    ],
  };
  const sp = Alda.buildStrokeProgress(anim, 0.5);
  assert(!('s0' in sp), 'opacity track should not appear in strokeProgress');
});

// ── Result ──────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
