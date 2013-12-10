/* jshint node: true */
"use strict";

var connect = require("connect")
  , http = require("http")
  , hubabuba = new require("../")();

hubabuba.on("error", function (err) {
  console.error(err);  
});

hubabuba.on("notification", function (item) {
  console.log(item);
});

var app = connect()
  .use(connect.logger("dev"))
  .use(hubabuba.handler());

http.createServer(app)
    .listen(3000, function () {
      console.log("listening on port 3000");  
    });