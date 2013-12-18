"use strict";

var connect = require("connect")
  , http = require("http")
  , url = require("url")
  , Hubabuba = require("../")
  , push = new Hubabuba("http://" + process.env.EXTERNAL_IP + ":3000/hubabuba", {
    debug : true
  });

push.on("error", console.error);

push.on("subscribed", function (item) {
  console.log("subscribed");
  console.log(item);
});

push.on("unsubscribed", function (item) {
  console.log("unsubscribed");
  console.log(item);
});

push.on("denied", function (item) {
  console.log("denied");
  console.log(item);
});

push.on("notification", function (item) {
  console.log("notification");
  console.log(item);
});

var app = connect()
  .use(connect.logger("dev"))
  .use(connect.query())
  .use(push.handler())
  .use(function (req, res, next) {
    var params, pathname; 
    
    var handleCallback = function (err, item) {
      if (err) {
        console.error(err);
        res.end("error occurred");
        return;
      }
            
      res.end("successful");      
    };
    
    pathname = url.parse(req.url).pathname;    
        
    if (pathname === "/subscriptions/") {
      params = req.query;
      
      if (params.mode === "subscribe") {
        push.subscribe({
          id: params.id,
          topic: params.topic,
          hub: params.hub
        }, handleCallback);
      } else {
        push.unsubscribe({
          id: params.id,
          topic: params.topic,
          hub: params.hub
        }, handleCallback);
      }
      
      return;
    }
    
    next();
  });

http.createServer(app)
    .listen(3000, function () {
      console.log("listening on port 3000");  
    });