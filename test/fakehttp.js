"use strict";

var util = require("util")
  , events = require("events")
  , sinon = require("sinon");

function FakeHttpClient() {
  this.requestParams = {};
  events.EventEmitter.call(this); 
}

util.inherits(FakeHttpClient, events.EventEmitter);

FakeHttpClient.prototype.write = function (params) {
  this.requestParams = params;
};

FakeHttpClient.prototype.end = function () {};

function FakeHttpResponse() {
  this.statusCode = 202;
  
  events.EventEmitter.call(this); 
}
util.inherits(FakeHttpResponse, events.EventEmitter);

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