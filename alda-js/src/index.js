'use strict';

const { load, isValid, AldaFont } = require('./parser.js');
const brush = require('./brush.js');
const { renderText, renderFrame, buildLayout, drawStroke, sampleStroke } = require('./renderer.js');
const { createPlayer, AldaPlayer, buildStrokeProgress, interpolateKeyframes } = require('./player.js');

// Register <alda-text> web component when running in a browser
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  require('./alda-text.js');
}

const Alda = {
  // Parsing
  load,
  isValid,

  // Rendering
  renderText,
  renderFrame,
  buildLayout,
  drawStroke,
  sampleStroke,

  // Animation
  createPlayer,
  buildStrokeProgress,
  interpolateKeyframes,

  // Brush utilities
  brush,
};

module.exports = Alda;
module.exports.default = Alda;

// Named exports for ESM-style destructuring in CJS
module.exports.AldaFont    = AldaFont;
module.exports.AldaPlayer  = AldaPlayer;
module.exports.load        = load;
module.exports.isValid     = isValid;
module.exports.renderText  = renderText;
module.exports.renderFrame = renderFrame;
module.exports.buildLayout = buildLayout;
module.exports.drawStroke  = drawStroke;
module.exports.sampleStroke = sampleStroke;
module.exports.createPlayer = createPlayer;
module.exports.buildStrokeProgress = buildStrokeProgress;
module.exports.interpolateKeyframes = interpolateKeyframes;
module.exports.brush = brush;
