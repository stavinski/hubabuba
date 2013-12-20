"use strict";

var util = require("util");

util.inherits(HubabubaError, Error);

function HubabubaError(msg, id) {
  this.message = msg;
  this.id = id;
}

/**
* @module HubabubaError
*/
module.exports = HubabubaError;