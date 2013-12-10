/* jshint node: true */
"use strict";

var connect = require("connect")
  , http = require("http")
  , Hubabuba = require("../")
  , feedHandler = new Hubabuba();

feedHandler.on("error", function (err) {
  console.error(err);  
});

feedHandler.on("content", function (item) {
  console.log(item);
});

var app = connect()
  .use(connect.logger("dev"))
  .use(feedHandler.handler());

http.createServer(app)
    .listen(3000, function () {
      console.log("listening on port 3000");  
    });