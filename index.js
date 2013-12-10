"use strict";

var util = require("util")
  , events = require("events")
  , extend = require("extend")
  , HubabubaError = require("./lib/error");

/*

options:

string url - url to match on (hubabbuba)
function verification - callback function with the subscription item 
                        allows customization about whether a (un)subscription
                        is allowed by returning a bool (always return true)  

example:

{
  url : "pushhandler",
  verification : function (item) {
    var sub = subs.find(item.id);
    if (item.mode === modes.SUBSCRIBE) {
      return (sub) && (sub.status === PENDING);
    }
  }
}

events emitted:

error - when an error occurs at anytime while handling requests
subscribed - when a hub has confirmed subscription
unsubscribed - when a hub has confirmed unsubscription
notification - when new content is sent from the hub
denied - when a hub denies a subscription (can happen at anytime)

*/
function Hubabuba (options) {
  this.opts = {
    url : "hubabuba",
    verification : function () { return true; }
  };
  
  extend(this.opts, options);
  events.EventEmitter.call(this); 
}

util.inherits(Hubabuba, events.EventEmitter);

Hubabuba.prototype.handler = function() {
  return function (req, res, next) {
    var url = req.originalUrl || req.url;
    
    if ("/" + this.opts.url === url) {
      if (!req.query) {
        this.emit("error", new HubabubaError("req.query is not defined"));
        return;
      }
      
      if (req.method === "GET") {
      
        var mode = req.query["hub.mode"];
        if (!mode) {
          this.emit("error", new HubabubaError("mode was not supplied"));
          return;
        }
        
        handleDenied.call(this, req, res);        
      }
      
      return;
    }
        
    return next();
  }.bind(this);
};

Hubabuba.prototype.subscribe = function (id) {
  
};

Hubabuba.prototype.unsubscribe = function (id) {
  
};

var handleDenied = function (req, res) {
  var required, valid;
  
  if (req.query["hub.mode"] !== "denied") return;
    
  required = ["id", "hub.topic", "hub.reason"];
  valid = required.every(function (key) {
    return req.query[key];
  });
  
  if (!valid) {
    this.emit("error", new HubabubaError("missing required query parameters"));
    return;
  }
  
  this.emit("denied", {
    id : req.query.id,
    topic : req.query["hub.topic"],
    reason : req.query["hub.reason"]
  });
  
  res.writeHead(200);
  res.end();
};

module.exports = Hubabuba;