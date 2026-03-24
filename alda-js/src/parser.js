'use strict';

const brushUtils = require('./brush.js');

// ── Validation helpers ──────────────────────────────────────

function isString(v) { return typeof v === 'string'; }
function isNumber(v) { return typeof v === 'number' && isFinite(v); }
function isArray(v)  { return Array.isArray(v); }
function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function validateMeta(meta, errors) {
  if (!isObject(meta))         { errors.push('meta: must be an object'); return; }
  if (!isString(meta.name))    errors.push('meta.name: required string');
  if (!isNumber(meta.upm) || meta.upm <= 0) errors.push('meta.upm: required positive number');
  if (!isNumber(meta.ascender))  errors.push('meta.ascender: required number');
  if (!isNumber(meta.descender)) errors.push('meta.descender: required number');
}

function validatePoint(pt, idx, errors) {
  if (!isObject(pt)) { errors.push(`point[${idx}]: must be an object`); return; }
  if (!isNumber(pt.x)) errors.push(`point[${idx}].x: required number`);
  if (!isNumber(pt.y)) errors.push(`point[${idx}].y: required number`);
  const validTypes = ['move', 'line', 'curve'];
  if (!validTypes.includes(pt.type)) errors.push(`point[${idx}].type: must be one of ${validTypes.join(', ')}`);
  if (pt.type === 'curve') {
    if (!isObject(pt.cp1) || !isNumber(pt.cp1.x) || !isNumber(pt.cp1.y))
      errors.push(`point[${idx}].cp1: required {x, y} for curve`);
    if (!isObject(pt.cp2) || !isNumber(pt.cp2.x) || !isNumber(pt.cp2.y))
      errors.push(`point[${idx}].cp2: required {x, y} for curve`);
  }
}

function validateStroke(stroke, si, errors) {
  if (!isObject(stroke)) { errors.push(`skeleton[${si}]: must be an object`); return; }
  if (!isString(stroke.id)) errors.push(`skeleton[${si}].id: required string`);
  if (!isArray(stroke.points) || stroke.points.length < 1)
    errors.push(`skeleton[${si}].points: required non-empty array`);
  else stroke.points.forEach((pt, pi) => validatePoint(pt, pi, errors));
  if (stroke.width_profile !== undefined) {
    if (!isArray(stroke.width_profile))
      errors.push(`skeleton[${si}].width_profile: must be an array`);
  }
}

function validateBrush(brush, errors) {
  if (!isObject(brush)) { errors.push('glyph.brush: must be an object'); return; }
  if (!isNumber(brush.rx) || brush.rx <= 0) errors.push('brush.rx: required positive number');
  if (!isNumber(brush.ry) || brush.ry <= 0) errors.push('brush.ry: required positive number');
  if (!isNumber(brush.angle)) errors.push('brush.angle: required number');
}

function validateGlyph(glyph, gi, errors) {
  if (!isObject(glyph)) { errors.push(`glyphs[${gi}]: must be an object`); return; }
  if (!isString(glyph.unicode)) errors.push(`glyphs[${gi}].unicode: required string (hex codepoint)`);
  if (!isNumber(glyph.advance) || glyph.advance < 0) errors.push(`glyphs[${gi}].advance: required non-negative number`);
  if (!isArray(glyph.skeleton)) errors.push(`glyphs[${gi}].skeleton: required array`);
  else glyph.skeleton.forEach((s, si) => validateStroke(s, si, errors));
  if (glyph.brush !== undefined) validateBrush(glyph.brush, errors);
}

function validateKeyframe(kf, ki, errors) {
  if (!isObject(kf)) { errors.push(`keyframe[${ki}]: must be an object`); return; }
  if (!isNumber(kf.t) || kf.t < 0 || kf.t > 1) errors.push(`keyframe[${ki}].t: must be 0..1`);
  if (!isNumber(kf.value)) errors.push(`keyframe[${ki}].value: required number`);
}

function validateTrack(track, ti, errors) {
  if (!isObject(track)) { errors.push(`track[${ti}]: must be an object`); return; }
  if (!isString(track.target))   errors.push(`track[${ti}].target: required string`);
  if (!isString(track.property)) errors.push(`track[${ti}].property: required string`);
  if (!isArray(track.keyframes) || track.keyframes.length < 1)
    errors.push(`track[${ti}].keyframes: required non-empty array`);
  else track.keyframes.forEach((kf, ki) => validateKeyframe(kf, ki, errors));
}

function validateAnimation(anim, ai, errors) {
  if (!isObject(anim)) { errors.push(`animations[${ai}]: must be an object`); return; }
  if (!isString(anim.id)) errors.push(`animations[${ai}].id: required string`);
  if (!isNumber(anim.duration) || anim.duration <= 0)
    errors.push(`animations[${ai}].duration: required positive number`);
  if (!isArray(anim.tracks)) errors.push(`animations[${ai}].tracks: required array`);
  else anim.tracks.forEach((t, ti) => validateTrack(t, ti, errors));
}

function validateFx(fx, fi, errors) {
  if (!isObject(fx)) { errors.push(`fx[${fi}]: must be an object`); return; }
  if (!isString(fx.id))   errors.push(`fx[${fi}].id: required string`);
  if (!isString(fx.type)) errors.push(`fx[${fi}].type: required string`);
  if (typeof fx.enabled !== 'boolean') errors.push(`fx[${fi}].enabled: required boolean`);
}

// ── AldaFont class ──────────────────────────────────────────

class AldaFont {
  constructor(data) {
    this._data = data;
    // index glyphs by unicode and char
    this._byUnicode = new Map();
    this._byChar    = new Map();
    for (const g of (data.glyphs ?? [])) {
      this._byUnicode.set(g.unicode.toUpperCase(), g);
      try {
        const char = String.fromCodePoint(parseInt(g.unicode, 16));
        this._byChar.set(char, g);
      } catch (_) { /* ignore malformed unicode */ }
    }
    this._animations = new Map((data.animations ?? []).map((a) => [a.id, a]));
  }

  get version()  { return this._data.alda; }
  get meta()     { return this._data.meta; }
  get glyphs()   { return this._data.glyphs ?? []; }
  get animations() { return this._data.animations ?? []; }
  get fx()       { return this._data.fx ?? []; }

  /** @param {string} unicode — hex string, e.g. 'AC00' */
  getGlyph(unicode) {
    return this._byUnicode.get(unicode.toUpperCase()) ?? null;
  }

  /** @param {string} char — actual character, e.g. '가' */
  getGlyphByChar(char) {
    return this._byChar.get(char) ?? null;
  }

  /** @param {string} id */
  getAnimation(id) {
    return this._animations.get(id) ?? null;
  }

  /** Returns only FX items where enabled === true */
  getEnabledFx() {
    return this.fx.filter((f) => f.enabled === true);
  }

  /** Serialize back to .alda JSON string */
  toJSON() {
    return JSON.stringify(this._data, null, 2);
  }
}

// ── Public API ──────────────────────────────────────────────

/**
 * Parse and validate an Alda JSON string or object.
 * @throws {SyntaxError} if jsonStringOrObject is a string with invalid JSON
 * @throws {TypeError}   if data is not a valid Alda document
 */
function load(jsonStringOrObject) {
  const data = typeof jsonStringOrObject === 'string'
    ? JSON.parse(jsonStringOrObject)
    : jsonStringOrObject;

  const errors = [];
  if (!isObject(data)) { throw new TypeError('Alda document must be a JSON object'); }
  if (!isString(data.alda)) errors.push('alda: version field required');
  if (isObject(data.meta)) validateMeta(data.meta, errors);
  else errors.push('meta: required object');
  if (isArray(data.glyphs)) data.glyphs.forEach((g, gi) => validateGlyph(g, gi, errors));
  if (isArray(data.animations)) data.animations.forEach((a, ai) => validateAnimation(a, ai, errors));
  if (isArray(data.fx)) data.fx.forEach((f, fi) => validateFx(f, fi, errors));

  if (errors.length > 0) {
    const err = new TypeError(`Invalid Alda document:\n  ${errors.join('\n  ')}`);
    err.errors = errors;
    throw err;
  }

  return new AldaFont(data);
}

/**
 * Returns true if data is a structurally valid Alda document.
 */
function isValid(data) {
  try { load(data); return true; } catch (_) { return false; }
}

module.exports = { load, isValid, AldaFont };
