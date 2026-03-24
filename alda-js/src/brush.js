/**
 * Alda brush math utilities
 * S = √(rx × ry)  — scale scalar (geometric mean)
 * ratio = ry / rx — flatness ratio
 */

'use strict';

const brush = {
  /**
   * S = √(rx × ry) — geometric mean, represents overall brush size
   */
  computeS(rx, ry) {
    return Math.sqrt(rx * ry);
  },

  /**
   * ry = S² / rx — recover ry when S and rx are known
   */
  computeRy(S, rx) {
    if (rx <= 0) throw new RangeError('rx must be > 0');
    return (S * S) / rx;
  },

  /**
   * roundness = (ry / rx) * 100  — 0..100 %
   * 100 = circle, 0 = flat line
   */
  computeRoundness(rx, ry) {
    if (rx <= 0) throw new RangeError('rx must be > 0');
    return (ry / rx) * 100;
  },

  /**
   * Scale brush by factor, preserving ratio and angle.
   * S' = S * factor  →  rx' = rx * factor,  ry' = ry * factor
   */
  scale(brush, factor) {
    if (factor <= 0) throw new RangeError('factor must be > 0');
    return {
      ...brush,
      rx: brush.rx * factor,
      ry: brush.ry * factor,
    };
  },

  /**
   * Fill missing brush fields with defaults.
   */
  normalize(b = {}) {
    const rx = typeof b.rx === 'number' && b.rx > 0 ? b.rx : 14;
    const ry = typeof b.ry === 'number' && b.ry > 0 ? b.ry : 6;
    return {
      rx,
      ry,
      angle: typeof b.angle === 'number' ? b.angle : 0,
      roundness: brush.computeRoundness(rx, ry),
    };
  },
};

module.exports = brush;
