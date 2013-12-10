/* jshint node: true */
"use strict";

var util = require("util")
  , events = require("events");

/*

options:

url - url to match on (hubabbuba)

events emitted:

error - when an error occurs at anytime while handling requests
subscribe - when the hub wants to confirm a subscription
unsubscribe - when the hub wants to confirm an unsubscription
content - when new content is sent from the hub

*/
var Handler = function (options) {
  this.opts = options || {
    url : "hubabuba"
  };
  events.EventEmitter.call(this); 
};

util.inherits(Handler, events.EventEmitter);

Handler.prototype.handler = function() {
  return function (req, res, next) {
    var url = req.originalUrl || req.url;
    
    if ("/" + this.opts.url === url) {
      console.log("match");
      res.writeHead(200);
      res.end("match");
      return;
    }
    
    console.log("no match");    
    next();  
    
  }.bind(this);
};

Handler.prototype.subscribe = function () {
  
};

Handler.prototype.unsubscribe = function () {
  
};

var handleError = function (err) {
  this.emit("error", err);
};

module.exports = Handler;