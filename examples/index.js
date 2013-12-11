/* jshint node: true */
"use strict";

var connect = require("connect")
  , http = require("http")
  , Hubabuba = require("../")
  , push = new Hubabuba();

push.on("error", function (err) {
  console.error(err);  
});

push.on("notification", function (item) {
  console.log(item);
});

var app = connect()
  .use(connect.logger("dev"))
  .use(push.handler());

http.createServer(app)
    .listen(3000, function () {
      console.log("listening on port 3000");  
    });