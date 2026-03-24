'use strict';

const { renderFrame } = require('./renderer.js');

// ── Keyframe interpolation ───────────────────────────────────

/**
 * Linear interpolation between two keyframes.
 * @param {Array<{t:number,value:number}>} keyframes
 * @param {number} t — 0..1
 * @returns {number}
 */
function interpolateKeyframes(keyframes, t) {
  if (!keyframes || keyframes.length === 0) return 1;
  if (t <= keyframes[0].t) return keyframes[0].value;
  const last = keyframes[keyframes.length - 1];
  if (t >= last.t) return last.value;

  for (let i = 1; i < keyframes.length; i++) {
    const k0 = keyframes[i - 1];
    const k1 = keyframes[i];
    if (t >= k0.t && t <= k1.t) {
      const tt = (t - k0.t) / (k1.t - k0.t);
      return k0.value + (k1.value - k0.value) * tt;
    }
  }
  return last.value;
}

/**
 * Build { [strokeId]: progress } map from animation tracks at normalized time t.
 * @param {object} animation
 * @param {number} t — 0..1
 * @returns {object}
 */
function buildStrokeProgress(animation, t) {
  const progress = {};
  for (const track of animation.tracks) {
    if (track.property === 'progress' || track.property === 'stroke_progress') {
      progress[track.target] = interpolateKeyframes(track.keyframes, t);
    }
  }
  return progress;
}

// ── AldaPlayer ───────────────────────────────────────────────

const _raf = typeof requestAnimationFrame !== 'undefined'
  ? (fn) => requestAnimationFrame(fn)
  : (fn) => setTimeout(fn, 16);
const _caf = typeof cancelAnimationFrame !== 'undefined'
  ? (id) => cancelAnimationFrame(id)
  : (id) => clearTimeout(id);
const _now = typeof performance !== 'undefined'
  ? () => performance.now()
  : () => Date.now();

class AldaPlayer {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./parser.js').AldaFont} font
   * @param {string} text
   * @param {object} animation  — animation object from AldaFont
   * @param {object} [opts]
   * @param {boolean} [opts.loop=true]
   * @param {function} [opts.onEnd]
   * @param {function} [opts.onFrame]   — called with (t) each rendered frame
   * @param {number} [opts.fontSize=60]
   * @param {number} [opts.x=20]
   * @param {number} [opts.y]
   * @param {string} [opts.color='#1e1e1e']
   */
  constructor(ctx, font, text, animation, opts = {}) {
    this._ctx  = ctx;
    this._font = font;
    this._text = text;
    this._anim = animation;
    this._opts = opts;

    this._t        = 0;
    this._start    = null;  // _now() anchor
    this._rafId    = null;
    this._playing  = false;
    this._loop     = opts.loop !== false;
    this._onEnd    = opts.onEnd   ?? null;
    this._onFrame  = opts.onFrame ?? null;
  }

  /** Normalized playback position (0..1). */
  get currentTime() { return this._t; }

  get playing() { return this._playing; }

  /** Start or resume playback. */
  play() {
    if (this._playing) return this;
    this._playing = true;
    this._start = _now() - this._t * this._anim.duration * 1000;
    this._tick();
    return this;
  }

  /** Pause at current position. */
  pause() {
    if (!this._playing) return this;
    this._playing = false;
    if (this._rafId !== null) { _caf(this._rafId); this._rafId = null; }
    return this;
  }

  /** Stop and reset to beginning. */
  stop() {
    this.pause();
    this._t = 0;
    this._render(0);
    return this;
  }

  /** Jump to normalized time (0..1). */
  seek(t) {
    this._t = Math.max(0, Math.min(1, t));
    if (this._playing) {
      this._start = _now() - this._t * this._anim.duration * 1000;
    }
    this._render(this._t);
    return this;
  }

  dispose() {
    this.pause();
  }

  // ── internal ──

  _tick() {
    if (!this._playing) return;

    const elapsed  = (_now() - this._start) / 1000;
    const duration = this._anim.duration;
    let t = elapsed / duration;

    if (t >= 1) {
      if (this._loop) {
        this._start = _now();
        t = 0;
      } else {
        this._playing = false;
        this._render(1);
        this._t = 1;
        if (this._onEnd) this._onEnd();
        return;
      }
    }

    this._t = t;
    this._render(t);
    if (this._onFrame) this._onFrame(t);
    this._rafId = _raf(() => this._tick());
  }

  _render(t) {
    const { ctx, _font, _text, _opts } = this;
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sp = buildStrokeProgress(this._anim, t);
    renderFrame(ctx, _font, _text, sp, _opts);
  }

  // alias so `this.ctx` works
  get ctx() { return this._ctx; }
}

// ── Public API ───────────────────────────────────────────────

/**
 * Create and return an AldaPlayer.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('./parser.js').AldaFont} font
 * @param {string} text
 * @param {string|object} animation  — animation ID string or animation object
 * @param {object} [opts]
 * @returns {AldaPlayer}
 */
function createPlayer(ctx, font, text, animation, opts = {}) {
  const anim = typeof animation === 'string' ? font.getAnimation(animation) : animation;
  if (!anim) throw new Error(`Alda: animation not found: "${animation}"`);
  return new AldaPlayer(ctx, font, text, anim, opts);
}

module.exports = { createPlayer, AldaPlayer, buildStrokeProgress, interpolateKeyframes };
