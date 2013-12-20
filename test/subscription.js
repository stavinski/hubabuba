/* jshint expr: true */
"use strict";

var url = require("url")
  , expect = require("chai").expect
  , sinon = require("sinon")
  , querystring = require("querystring")
  , mockery = require("mockery")
  , Hubabuba = require("../");

describe("when subscribing/unsubscribing", function () {
  var sut, callbackUrl, request, http, item, requestCallback;
  
  beforeEach(function () {
    mockery.enable();
    mockery.registerSubstitute("http", "./test/fakehttp");
    mockery.registerSubstitute("https", "./test/fakehttp");
    mockery.registerAllowable('./fakehttp');
    
    http = require("./fakehttp");
    http.init();
    
    callbackUrl = "http://callback.com/hubabuba";
    sut = new Hubabuba(callbackUrl, { secret: "bubblegum" });
    
    item = {
      id: "123456789",
      topic: "http://foo.com/feed",
      hub: "https://superfeedr.com/",
      leaseSeconds: 10000
    }; 
  });
  
  afterEach(function () {
    mockery.deregisterSubstitute("http", "./test/fakehttp");
    mockery.deregisterSubstitute("https", "./test/fakehttp");  
    mockery.disable();
  });
        
  it("should use defaults for missing items", function () {
    var callback;
    callback = false;
    item.leaseSeconds = undefined;
        
    sut.subscribe(item, function (err, result) {
      callback = true;
      expect(result).to.exist;
      expect(result.leaseSeconds).to.equal(sut.opts.leaseSeconds);
    });
        
    http.client.emit("response", { statusCode : 200 });
    expect(callback).to.be.true;
  });
  
  it("should callback with error when item not passed", function () {
    sut.subscribe(null, function (err, sent) {
      expect(err).to.exist;
    });
  });
  
  it("should callback with error when required params not passed", function () {
    sut.subscribe({}, function (err, sent) {
      expect(err).to.exist;
    });
  });
  
  it("should callback with error when protocol is not supported", function () {
    item.hub = "ftp://superfeedr.com/",
    
    sut.subscribe(item, function (err) {
      expect(err).to.exist;
    });
    
  });

  it("should use correct request options", function () {
    var params, hub;
    hub = url.parse(item.hub);
    params = {
      method: "POST",
      hostname: hub.hostname,
      path : hub.path,
      port: 443,
      headers : {
        "Content-Type" : "application/x-www-form-urlencoded",
        "Content-Length": 199
      }
    }; 
        
    http.request = sinon.spy(http, "request");
    sut.subscribe(item);
    expect(http.request.calledWith(params)).to.be.true;
  });

  it("should write the correct subscribe params", function () {
    var params;
        
    params = querystring.stringify({
      "hub.mode": "subscribe",
      "hub.callback": "http://callback.com/hubabuba?id=" + item.id,
      "hub.topic": item.topic,
      "hub.lease_seconds": item.leaseSeconds,
      "hub.secret" : "be3221c0bc209b830af034f4b46d6dcfc5660c52"
    });
    sut.subscribe(item);
    expect(http.client.requestParams).to.equal(params);
  });
  
  it("should write the correct unsubscribe params", function () {
    var params;
        
    params = querystring.stringify({
      "hub.mode": "unsubscribe",
      "hub.callback": "http://callback.com/hubabuba?id=" + item.id,
      "hub.topic": item.topic,
      "hub.lease_seconds": item.leaseSeconds,
      "hub.secret" : "be3221c0bc209b830af034f4b46d6dcfc5660c52"
    });
    sut.unsubscribe(item);
    expect(http.client.requestParams).to.equal(params);
  });
  
  it("should callback with error if request returned error", function () {
    var callback;
    callback = false;
    sut.subscribe(item, function (err, result) {
      callback = true;
      expect(err).to.exist;
    });
    http.client.emit("error", new Error("test"));
    expect(callback).to.be.true;
  });
  
  it("should callback with error if response is not a 200", function () {
    var callback, response;
    callback = false;
    http.response.statusCode = 404;
    
    sut.subscribe(item, function (err, result) {
      callback = true;
      expect(err).to.exist;
      expect(err.message).to.equal("test err");
    });
    
    http.client.emit("response", http.response);
    http.response.emit("data", "test err");
    http.response.emit("end");
    
    expect(callback).to.be.true;
  });
  
  it("should populate item correctly", function () {
    var callback;
    callback = false;
    sut.subscribe(item, function (err, result) {
      callback = true;
      expect(item).to.equal(result);
    });
    
    http.client.emit("response", { statusCode : 200 });
    expect(callback).to.be.true;
  });
    
  
});
