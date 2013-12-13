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

var fakehttp = {
  init : function () {
    this.client = new FakeHttpClient();
  },
  request: function (opts) {
    return this.client;
  }
};

module.exports = fakehttp;