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

var raiseError = function (err) {
  /**
  * when an error occurs at anytime while handling requests 
  *
  * @event Hubabuba#error
  * @type {HubabubaError}
  */
  this.emit("error", err);
};

module.exports = HubabubaError;
module.exports.raiseError = raiseError;