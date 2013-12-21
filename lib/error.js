"use strict";

var util = require("util");

util.inherits(HubabubaError, Error);

/**
* @class HubabubaError
* @property {string} message - details about the error
* @property {number} id - the id of the subscription item
*/
function HubabubaError(msg, id) {
  this.message = msg;
  this.id = id;
}

module.exports = HubabubaError;