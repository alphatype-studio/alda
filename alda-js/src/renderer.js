'use strict';

/**
 * Alda canvas renderer
 *
 * Coordinate system:
 *   - Alda: y-up, units = UPM fractions
 *   - Canvas: y-down, units = pixels
 *   Transform: canvasY = baseline - (aldaY / upm * fontSize)
 *              canvasX = originX + (aldaX / upm * fontSize)
 */

// ── Geometry helpers ────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * Sample a cubic Bézier curve into N canvas-space points.
 * n0/n1 are Alda point objects with optional cp1/cp2.
 */
function sampleSegment(n0, n1, steps, upm, fontSize, ox, baseline) {
  const toCanvas = (x, y) => ({
    x: ox + (x / upm) * fontSize,
    y: baseline - (y / upm) * fontSize,
  });

  const p0 = toCanvas(n0.x, n0.y);
  const p1 = n0.type === 'curve' && n0.cp1
    ? toCanvas(n0.cp1.x, n0.cp1.y)
    : p0;
  const p2 = n1.type === 'curve' && n1.cp2 !== undefined
    ? toCanvas(n1.cp2.x, n1.cp2.y)
    : (n0.type === 'curve' && n0.cp2 ? toCanvas(n0.cp2.x, n0.cp2.y) : toCanvas(n1.x, n1.y));
  const p3 = toCanvas(n1.x, n1.y);

  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, u = 1 - t;
    pts.push({
      x: u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x,
      y: u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y,
    });
  }
  return pts;
}

/**
 * Sample an entire stroke into canvas-space points with arc-length distances.
 * Returns { pts: [{x,y}], arcLen: [number] }
 */
function sampleStroke(stroke, upm, fontSize, ox, baseline) {
  const pts = [];
  const { points } = stroke;

  for (let i = 0; i < points.length; i++) {
    const cur = points[i];
    if (i === 0) {
      pts.push({
        x: ox + (cur.x / upm) * fontSize,
        y: baseline - (cur.y / upm) * fontSize,
      });
    } else {
      const prev = points[i - 1];
      const isCurve = cur.type === 'curve';
      const steps = isCurve ? 16 : 1;
      const seg = sampleSegment(prev, cur, steps, upm, fontSize, ox, baseline);
      for (let s = 1; s < seg.length; s++) pts.push(seg[s]);
    }
  }

  // Accumulate arc lengths
  const arcLen = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i-1].x, dy = pts[i].y - pts[i-1].y;
    arcLen.push(arcLen[i-1] + Math.sqrt(dx*dx + dy*dy));
  }

  return { pts, arcLen, total: arcLen[arcLen.length - 1] || 0 };
}

/**
 * Get interpolated width at arc-length fraction t (0..1),
 * given a width_profile array and base brush width.
 */
function widthAt(t, widthProfile, baseWidth) {
  if (!widthProfile || widthProfile.length === 0) return baseWidth;
  const n = widthProfile.length;
  const fi = t * (n - 1);
  const i = Math.min(n - 2, Math.floor(fi));
  const frac = fi - i;
  const w = lerp(widthProfile[i], widthProfile[i + 1] ?? widthProfile[i], frac);
  return baseWidth * (w / 100);
}

// ── Core draw ────────────────────────────────────────────────

/**
 * Draw a stroke on ctx up to `progress` (0..1).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} stroke  — Alda stroke object
 * @param {number} progress — 0..1 drawing progress
 * @param {object} brush   — {rx, ry, angle}
 * @param {object} opts    — {upm, fontSize, ox, baseline, color}
 */
function drawStroke(ctx, stroke, progress, brush, opts) {
  const { upm, fontSize, ox, baseline, color = '#1e1e1e' } = opts;
  if (progress <= 0 || !stroke.points || stroke.points.length < 2) return;

  const { pts, arcLen, total } = sampleStroke(stroke, upm, fontSize, ox, baseline);
  if (pts.length < 2 || total === 0) return;

  const cutLen = progress * total;
  const baseWidth = ((brush.rx + brush.ry) / 2 / upm) * fontSize * 2;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;

  let prevPt = pts[0];
  let prevT = 0;

  for (let i = 1; i < pts.length; i++) {
    if (arcLen[i] > cutLen) break;
    const t = arcLen[i] / total;
    const w = widthAt(lerp(prevT, t, 0.5), stroke.width_profile, baseWidth);
    ctx.beginPath();
    ctx.lineWidth = Math.max(0.5, w);
    ctx.moveTo(prevPt.x, prevPt.y);
    ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    prevPt = pts[i];
    prevT = t;
  }

  // Draw partial last segment
  if (prevPt !== pts[pts.length - 1]) {
    const i = pts.findIndex((_, idx) => arcLen[idx] >= cutLen);
    if (i > 0) {
      const seg0 = pts[i - 1], seg1 = pts[i];
      const segLen = arcLen[i] - arcLen[i - 1];
      const remain = cutLen - arcLen[i - 1];
      const tt = segLen > 0 ? remain / segLen : 0;
      const ex = lerp(seg0.x, seg1.x, tt);
      const ey = lerp(seg0.y, seg1.y, tt);
      const t = arcLen[i - 1] / total;
      const w = widthAt(t, stroke.width_profile, baseWidth);
      ctx.beginPath();
      ctx.lineWidth = Math.max(0.5, w);
      ctx.moveTo(seg0.x, seg0.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  }
}

// ── Layout ──────────────────────────────────────────────────

/**
 * Build layout: resolve glyphs from text string, compute positions.
 * Returns array of { glyph, ox } (origin X per character in pixels).
 */
function buildLayout(font, text, fontSize) {
  const upm = font.meta.upm;
  const chars = [...text]; // handle multi-byte (emoji, hangul)
  let ox = 0;
  return chars.map((char) => {
    const glyph = font.getGlyphByChar(char);
    const advance = glyph ? glyph.advance : upm * 0.6;
    const result = { glyph, char, ox };
    ox += (advance / upm) * fontSize;
    return result;
  });
}

// ── Public API ───────────────────────────────────────────────

/**
 * Render all glyphs of `text` at full (static) display.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {AldaFont} font
 * @param {string} text
 * @param {object} opts
 * @param {number} [opts.fontSize=60]
 * @param {number} [opts.x=20]        — left margin
 * @param {number} [opts.y]           — baseline Y (default: canvas.height * 0.75)
 * @param {string} [opts.color='#1e1e1e']
 * @param {number} [opts.letterSpacing=0]
 */
function renderText(ctx, font, text, opts = {}) {
  const {
    fontSize = 60,
    x = 20,
    y = ctx.canvas.height * 0.75,
    color = '#1e1e1e',
    letterSpacing = 0,
  } = opts;

  const layout = buildLayout(font, text, fontSize);
  const upm = font.meta.upm;
  const defaultBrush = { rx: 14, ry: 6, angle: 0 };

  for (const { glyph, ox } of layout) {
    if (!glyph) continue;
    const brush = glyph.brush ?? defaultBrush;
    const originX = x + ox + letterSpacing * (layout.indexOf({ glyph, ox }));
    for (const stroke of glyph.skeleton) {
      drawStroke(ctx, stroke, 1, brush, { upm, fontSize, ox: originX, baseline: y, color });
    }
  }
}

/**
 * Render with per-glyph, per-stroke progress values.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {AldaFont} font
 * @param {string} text
 * @param {object} strokeProgress  — { [strokeId]: progress (0..1) }
 * @param {object} opts
 */
function renderFrame(ctx, font, text, strokeProgress, opts = {}) {
  const {
    fontSize = 60,
    x = 20,
    y = ctx.canvas.height * 0.75,
    color = '#1e1e1e',
    letterSpacing = 0,
  } = opts;

  const layout = buildLayout(font, text, fontSize);
  const upm = font.meta.upm;
  const defaultBrush = { rx: 14, ry: 6, angle: 0 };

  let lsOffset = 0;
  for (const { glyph, ox } of layout) {
    if (!glyph) { lsOffset += letterSpacing; continue; }
    const brush = glyph.brush ?? defaultBrush;
    const originX = x + ox + lsOffset;
    for (const stroke of glyph.skeleton) {
      const prog = strokeProgress[stroke.id] ?? 1;
      drawStroke(ctx, stroke, prog, brush, { upm, fontSize, ox: originX, baseline: y, color });
    }
    lsOffset += letterSpacing;
  }
}

module.exports = { renderText, renderFrame, buildLayout, drawStroke, sampleStroke };
