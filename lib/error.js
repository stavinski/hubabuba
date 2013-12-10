"use strict";

var util = require("util");

function HubabubaError(msg, id) {
  this.message = msg;
  this.id = id;
}

util.inherits(HubabubaError, Error);

module.exports = HubabubaError;