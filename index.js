"use strict";

var util = require("util")
  , url = require("url")
  , http = require("http")
  , querystring = require("querystring")
  , events = require("events")
  , extend = require("extend")
  , HubabubaError = require("./lib/error")
  , HubabubaItem = require("./lib/item");

util.inherits(Hubabuba, events.EventEmitter);

/*

string url:

url that callback handler is associated with required

options:

bool debug - turns on debug mdoe to allow diagnosing issues (false)
function verification - callback function with the subscription item 
                        allows customization about whether a (un)subscription
                        is allowed by returning a bool (always return true)
  defaults:
    number leaseSeconds - number of seconds that the subscription should be active for, please note that the hub does
                          not need to honor this value so always use the returned leaseSeconds from subscribed
                          event as a guide to when expiry is to be expected (86400 1day)
  

example:

{
  url : "http://www.myhost.com/hubabuba",
  debug : true,
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
function Hubabuba (callbackUrl, options) {
  if (!callbackUrl)
    throw new HubabubaError("callbackUrl must be supplied");
  
  this.url = callbackUrl;
  this.callbackUrl = url.parse(this.url);
  
  this.opts = {
    debug : false,
    verification : function () { return true; },
    defaults : {
      leaseSeconds : 86400 // 1day
    }
  };
    
  extend(true, this.opts, options);
  events.EventEmitter.call(this); 
  
  this.debugLog = function (msg) {
    if (this.opts.debug)
      console.log(msg);
    
  }.bind(this);
}

/**
*
* This is the method that is hooked into connect in order to handle callbacks from the hub, the handler should use the same url that
* is passed as the options.url 
*
* Before this handler is plugged into the connect pipeline make sure that the connect.query middleware is placed before
*
* Example:
*
* app.use("/pubsub", hubabuba.handler());
*
*/
Hubabuba.prototype.handler = function() {
  return function (req, res, next) {
    var requestUrl, mode;
    requestUrl = req.originalUrl || req.url;
    
    if (this.callbackUrl.pathname === url.parse(requestUrl).pathname) {
      if (!req.query) {
        this.emit("error", new HubabubaError("req.query is not defined"));
        res.writeHead(400); // bad request
        res.end();
        return;
      }
            
      if (req.method === "GET") {
        mode = req.query["hub.mode"];
        if (!mode) {
          this.emit("error", new HubabubaError("mode was not supplied"));
          res.writeHead(400); // bad request
          res.end();
          return;
        }
        
        handleDenied.call(this, req, res);
        handleVerification.call(this, req, res);
      } else if (req.method === "POST") {
        handleNotification.call(this, req, res);
      } else {
        this.emit("error", new HubabubaError("method supplied is not GET or POST"));
        res.writeHead(405); //method not allowed
        res.end();
        return;
      }
      
      return;
    }
        
    return next();
  }.bind(this);
};

/**
*
* Used to subscribe to a pubsubhubub hub, item should be defined as:
*
* {
*   id: "52ab86db7d468bb12bb455a8", (allows the caller to specify a custom id such as a db id)
*   hub: "http://pubsubhubbubprovider.com/hub", (the hub provider that is proving the pubsubhubub capability)
*   topic: "http://www.blog.com/feed", (the topic the caller wants to subscribe to)
*   leaseSeconds: 604800 // 1wk (optional) (how long the subscription should remain active for, can be changed by hub)
* }
*
* The callback returns an error (null if everything worked) and also the item passed to it (if it is defined), this callback
* confirms that the subscription request has reached the hub (if err is null) but does not means that we are now subscribed
* as there are further steps that need to take place (validation / verification)
*
*/
Hubabuba.prototype.subscribe = function (item, cb) {
  subscriptionRequest.call(this, item, cb, "subscribe");
};

/**
*
* Used to unsubscribe from a pubsubhub hub, works in the same way as the subscribe method, also does not mean that we are
* unsubscribed from the hub as the hub will verify that the request is legitimate
*
*/
Hubabuba.prototype.unsubscribe = function (item, cb) {
  subscriptionRequest.call(this, item, cb, "unsubscribe");
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

var subscriptionRequest = function (item, cb, mode) {
  var hub, protocol, callback, req, params, http, leaseSeconds, reqOptions;
  
  callback = cb || function () {}; // default to a no-op
    
  if (!item) {
    callback(new HubabubaError("item not supplied"));
    return;
  }
  
  if (!objectHasProperties(item, ["id", "hub", "topic"])) {
    callback(new HubabubaError("required params not supplied on item", item.id), item);
    return;
  }
  
  item.leaseSeconds = item.leaseSeconds || this.opts.defaults.leaseSeconds;
  hub = url.parse(item.hub);
  protocol = hub.protocol.substr(0, hub.protocol.length - 1);
  if (!/^https?$/.test(protocol)) {
    callback(new HubabubaError("protocol of hub is not supported", item.id));
    return;
  }
  
  http = require(protocol); // either http or https
  
  params = querystring.stringify({
    "hub.mode": mode,
    "hub.callback": this.url + "?id=" + item.id,
    "hub.topic": item.topic,
    "hub.lease_seconds": item.leaseSeconds
  });
    
  reqOptions = {
    method: "POST",
    hostname: hub.hostname,
    path: hub.path,
    port: (protocol === "http") ? 80 : 443,
    headers : {
      "Content-Type" : "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(params)
    }
  };
  
  this.debugLog("making web request with options: " + JSON.stringify(reqOptions));  
  req = http.request(reqOptions);
  
  req.on("response", function (res) {
    var code, reason;
    reason = "";
    code = Math.floor(res.statusCode / 100);
    if (code != 2) {
      // according to working draft error details will be provided in the body as plaintext
      res.on("data", function (data) { 
        reason += data;  
      });
      
      res.on("end", function () {
        callback(new HubabubaError(reason, item.id), item);
      });
      
      return;
    }
    
    callback(null, item);
  });
  
  req.on("error", function (err) {
    callback(new HubabubaError(err.message, item.id), item);
  });
    
  this.debugLog("sending body params: " + JSON.stringify(params));  
  req.write(params);
  req.end();
};

var handleVerification = function (req, res) {
  var mode, modeRegexp, query, verification, item;
  query = req.query;
  mode = query["hub.mode"];
    
  if (!/^(?:un)?subscribe$/i.test(mode)) return;
  
  if (!objectHasProperties(query, ["id", "hub.topic", "hub.challenge"])) {
    this.emit("error", new HubabubaError("missing required query parameters"));
    res.end();
    return;
  }
  
  // must be supplied for a subscribe
  if ((mode === "subscribe") && (!query["hub.lease_seconds"])) {
    this.emit("error", new HubabubaError("missing required query parameters"));
    res.end();
    return;
  }
  
  item = new HubabubaItem(req.query);
  verification = this.opts.verification(item);
  
  if (verification) {
    res.writeHead(200);
    res.write(query["hub.challenge"]);
    
    var evt = (mode === "subscribe") ? "subscribed" : "unsubscribed";
    this.emit(evt, item);
  } else {
    res.writeHead(500);
  }
  
  res.end();
};

var handleNotification = function (req, res) {
  var id, source;
  
  id = req.query.id;
  if (!id) {
    this.emit("error", new HubabubaError("missing id parameter"));
    res.writeHead(500);
    res.end();
    return;
  }
  
  source = parseLinkHeaders(req.headers);
  this.emit("notification", {
    id: id,
    topic: source.topic,
    hub: source.hub,
    request: req
  });
  
  res.writeHead(200);
  res.end();
};

/**
*
* Helper function that can check that all properties exist on an object
*
*/
var objectHasProperties = function (obj, props) {
  return props.every(function (prop) {
    return obj.hasOwnProperty(prop);
  });
};

/**
*
* Helper function to parse the link headers from the http request
*
* Example:
*
* <http://pubsubhubbub.superfeedr.com>; rel=\"hub\",<http://blog.superfeedr.com/my-resource>; rel=\"self\"
*
*/
var parseLinkHeaders = function (headers) {
  var linkHeader, source, links;
  
  var mapLinks = function (link) {
    var regex, match;
    regex = new RegExp('^<(.*)>;\\srel="(.*)"');
    match = link.match(regex);
    if (match) {
      return {
        rel: match[2],
        url: match[1]
      };
    }
    
    return null;
  };
    
  var convertLinks = function (links) {
    var map = {};
    links.forEach(function (link) {
      if (link)      
        map[link.rel] = link.url;
    });
    return map;
  };
  
  linkHeader = headers.link;
  source = {};
  
  if (linkHeader) {
    links = convertLinks(linkHeader.split(",").map(mapLinks));
    source.hub = links.hub;
    source.topic = links.self;
  }
    
  return source;
};

module.exports = Hubabuba;