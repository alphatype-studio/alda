'use strict';

/**
 * <alda-text> — zero-JS web component for rendering Alda skeleton fonts.
 *
 * Usage:
 *   <script src="https://cdn.jsdelivr.net/npm/alda-js/dist/alda-text.js"></script>
 *   <alda-text src="font.alda" animate="write">안녕하세요</alda-text>
 *
 * Attributes:
 *   src          — URL of the .alda font file (required)
 *   text         — override text content (optional; falls back to element textContent)
 *   animate      — animation ID to play (optional; static if absent)
 *   font-size    — font size in px (default: auto-fit to container width)
 *   color        — fill color (default: currentColor → #1e1e1e)
 *   loop         — "true" | "false" (default: true)
 *   autoplay     — "true" | "false" (default: true)
 *   width        — canvas width  (default: container clientWidth or 480)
 *   height       — canvas height (default: auto from font metrics)
 */

const { load } = require('./parser.js');
const { renderText } = require('./renderer.js');
const { createPlayer } = require('./player.js');

const OBSERVED = ['src', 'text', 'animate', 'font-size', 'color', 'loop', 'autoplay', 'width', 'height'];

class AldaText extends HTMLElement {
  static get observedAttributes() { return OBSERVED; }

  constructor() {
    super();
    this._shadow  = this.attachShadow({ mode: 'open' });
    this._canvas  = document.createElement('canvas');
    this._shadow.appendChild(this._canvas);
    this._font    = null;
    this._player  = null;
    this._loading = false;
  }

  // ── Lifecycle ──

  connectedCallback() {
    this._init();
  }

  disconnectedCallback() {
    this._player?.dispose();
    this._player = null;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'src') {
      this._font = null;
      this._player?.dispose();
      this._player = null;
    }
    if (this.isConnected) this._init();
  }

  // ── Public ──

  play()  { this._player?.play();  }
  pause() { this._player?.pause(); }
  stop()  { this._player?.stop();  }

  /** Seek to normalized time 0..1. */
  seek(t) { this._player?.seek(t); }

  // ── Internal ──

  _attr(name, fallback) {
    const v = this.getAttribute(name);
    return v !== null ? v : fallback;
  }

  _boolAttr(name, fallback = true) {
    const v = this.getAttribute(name);
    if (v === null) return fallback;
    return v !== 'false';
  }

  _text() {
    return this._attr('text', null) ?? this.textContent?.trim() ?? '';
  }

  _fontSize(canvasW, text, upm) {
    const explicit = this._attr('font-size', null);
    if (explicit) return parseFloat(explicit);

    // auto-fit: target 80% of canvas width
    if (!text || !upm) return 60;
    const charCount = [...text].length || 1;
    const approxAdvance = upm * 0.9; // rough estimate per char
    const totalUnits = charCount * approxAdvance;
    const fit = (canvasW * 0.9) / (totalUnits / upm);
    return Math.max(12, Math.min(240, fit));
  }

  async _loadFont() {
    const src = this._attr('src', null);
    if (!src) return null;
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      return load(text);
    } catch (e) {
      console.warn('[alda-text] Failed to load font:', e.message);
      return null;
    }
  }

  async _init() {
    if (this._loading) return;
    this._loading = true;

    try {
      // Load font if not already cached
      if (!this._font) {
        this._font = await this._loadFont();
        if (!this._font) { this._loading = false; return; }
      }

      this._setup();
    } finally {
      this._loading = false;
    }
  }

  _setup() {
    const font  = this._font;
    const text  = this._text();
    const canvas = this._canvas;

    // Canvas dimensions
    const upm = font.meta.upm;
    const containerW = this.clientWidth || parseFloat(this._attr('width', '0')) || 480;
    const fs = this._fontSize(containerW, text, upm);

    const explicitW = parseFloat(this._attr('width',  '0')) || containerW || 480;
    const ascPx   = (font.meta.ascender  / upm) * fs;
    const descPx  = Math.abs(font.meta.descender / upm) * fs;
    const explicitH = parseFloat(this._attr('height', '0')) || Math.ceil(ascPx + descPx + fs * 0.2);

    canvas.width  = explicitW;
    canvas.height = explicitH;
    canvas.style.display = 'block';
    canvas.style.maxWidth = '100%';

    const ctx      = canvas.getContext('2d');
    const color    = this._attr('color', null) ?? getComputedStyle(this).color ?? '#1e1e1e';
    const baseline = ascPx + fs * 0.1;
    const renderOpts = { fontSize: fs, x: 0, y: baseline, color };

    // Dispose previous player
    this._player?.dispose();
    this._player = null;

    const animId  = this._attr('animate', null);
    const loop    = this._boolAttr('loop', true);
    const autoplay = this._boolAttr('autoplay', true);

    if (animId) {
      const anim = font.getAnimation(animId);
      if (!anim) {
        console.warn(`[alda-text] Animation "${animId}" not found in font`);
        // Fall through to static render
      } else {
        this._player = createPlayer(ctx, font, text, anim, { ...renderOpts, loop });
        if (autoplay) this._player.play();
        return;
      }
    }

    // Static render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderText(ctx, font, text, renderOpts);
  }
}

// ── Register ─────────────────────────────────────────────────

if (typeof customElements !== 'undefined' && !customElements.get('alda-text')) {
  customElements.define('alda-text', AldaText);
}

module.exports = AldaText;
