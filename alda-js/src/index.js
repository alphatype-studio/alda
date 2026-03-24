'use strict';

const { load, isValid, AldaFont } = require('./parser.js');
const brush = require('./brush.js');

const Alda = { load, isValid, brush };

module.exports = Alda;
module.exports.default = Alda;
module.exports.AldaFont = AldaFont;
