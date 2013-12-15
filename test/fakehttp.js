"use strict";

var util = require("util")
  , events = require("events")
  , sinon = require("sinon");

util.inherits(FakeHttpClient, events.EventEmitter);
util.inherits(FakeHttpResponse, events.EventEmitter);

function FakeHttpClient() {
  this.requestParams = {};
  events.EventEmitter.call(this); 
}

FakeHttpClient.prototype.write = function (params) {
  this.requestParams = params;
};

FakeHttpClient.prototype.end = function () {};

function FakeHttpResponse() {
  this.statusCode = 999;
  this.body = "";
  
  events.EventEmitter.call(this); 
}

FakeHttpResponse.prototype.writeHead = function (statusCode) {
  this.statusCode = statusCode;
};
FakeHttpResponse.prototype.end = function () {};
FakeHttpResponse.prototype.write = function (content) {
  this.body = content;
};

var fakehttp = {
  init : function () {
    this.client = new FakeHttpClient();
    this.response = new FakeHttpResponse();
  },
  request: function (opts) {
    return this.client;
  },
  response: function () {
    return this.response;
  }
};

module.exports = fakehttp;