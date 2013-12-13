"use strict";

var util = require("util")
  , url = require("url")
  , http = require("http")
  , querystring = require("querystring")
  , events = require("events")
  , extend = require("extend")
  , HubabubaError = require("./lib/error");

/*

options:

string url - url that callback handler is associated with (http://localhost:3000/hubabuba)
function verification - callback function with the subscription item 
                        allows customization about whether a (un)subscription
                        is allowed by returning a bool (always return true)
  defaults:
    number leaseSeconds - number of seconds that the subscription should be active for, please note that the hub does
                          not need to honor this value so always use the returned leaseSeconds from subscribed
                          event as a guide to when expiry is to be expected (86400)
  

example:

{
  url : "http://www.myhost.com/hubabuba",
  verification : function (item) {
    var sub = subs.find(item.id);
    if (item.mode === modes.SUBSCRIBE) {
      return (sub) && (sub.status === modes.PENDING);
    }
  },
  defaults : {
    leaseSeconds : 10000
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
    url : "http://localhost:3000/hubabuba",
    verification : function () { return true; },
    defaults : {
      leaseSeconds : 86400 // 1day
    }
  };
  
  extend(true, this.opts, options);
  events.EventEmitter.call(this); 
  
  this.callbackUrl = url.parse(this.opts.url);
}

util.inherits(Hubabuba, events.EventEmitter);

Hubabuba.prototype.handler = function() {
  return function (req, res, next) {
    var url, mode;
    url = req.originalUrl || req.url;
    
    if (this.callbackUrl.pathname === url) {
      if (!req.query) {
        this.emit("error", new HubabubaError("req.query is not defined"));
        return;
      }
      
      if (req.method === "GET") {
        mode = req.query["hub.mode"];
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

Hubabuba.prototype.subscribe = function (item, cb) {
  var hub, protocol, callback, req, params, request, leaseSeconds, reqOptions;
  
  callback = cb || function () {}; // default to a no-op
    
  if (!item) {
    callback(new HubabubaError("item not supplied"));
    return;
  }
  
  if (!objectHasProperties(item, ["id", "hub", "topic"])) {
    callback(new HubabubaError("required params not supplied on item", item.id));
    return;
  }
  
  item.leaseSeconds = item.leaseSeconds || this.opts.defaults.leaseSeconds;
  hub = url.parse(item.hub);
  protocol = hub.protocol.substr(0, hub.protocol.length - 1);
  if ((protocol !== "http") && (protocol !== "https")) {
    callback(new HubabubaError("protocol of hub is not supported", item.id));
    return;
  }
  
  req = require(protocol);
  reqOptions = {
    method: "POST",
    hostname: item.hub,
    headers : {
      "Content-Type" : "application/x-www-form-urlencoded"
    }
  };
  request = req.request(reqOptions, function (err, res) {
      if (err) {
        callback(new HubabubaError(err.message, item.id), null);
        return;
      }
      
      callback(null, item);
    });
      
  params = querystring.stringify({
    "hub.callback": this.opts.url + "/?id=" + item.id,
    "hub.mode": "subscribe",
    "hub.topic": item.topic,
    "hub.lease_seconds": item.leaseSeconds
  });
  
  request.write(params);
  request.end();
};

Hubabuba.prototype.unsubscribe = function (id) {
  
};

var handleDenied = function (req, res) {
  var required, valid;
  
  if (req.query["hub.mode"] !== "denied") return;
    
  if (!objectHasProperties(req.query, ["id", "hub.topic", "hub.reason"])) {
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

var objectHasProperties = function (obj, props) {
  return props.every(function (prop) {
    return obj.hasOwnProperty(prop);
  });
};

module.exports = Hubabuba;