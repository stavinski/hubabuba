"use strict";

var streams = require("streams")
  , utils = require("utils");

utils.inherits(HubabubaNotification, streams.Readable);

function HubabubaNotification(req) {
  this.req = req;
  this.readable = true;
  
  // any events raised re-emit from this object
  var emit = this.emit.bind(this);
  req.on(emit);
}

HubabubaNotification.prototype.read = function (size) {
  return this.req.read(size);
};

HubabubaNotification.prototype.pause = function () {
  this.req.pause();
};

HubabubaNotification.prototype.resume = function () {
  this.req.resume();
};

module.exports = HubabubaNotification;