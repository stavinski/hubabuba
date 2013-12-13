/* jshint expr: true */
"use strict";

var expect = require("chai").expect
  , sinon = require("sinon")
  , querystring = require("querystring")
  , mockery = require("mockery")
  , Hubabuba = require("../");

describe("when subscribing", function () {
  var sut, request, http, item, requestCallback;
  
  beforeEach(function () {
    mockery.enable();
    mockery.registerSubstitute("http", "./test/fakehttp");
    mockery.registerSubstitute("https", "./test/fakehttp");
    mockery.registerAllowable('./fakehttp');
    
    http = require("./fakehttp");
    http.init();
        
    sut = new Hubabuba({
      url: "http://callback.com/hubabuba"
    });
    
    item = {
      id: "123456789",
      topic: "http://foo.com/feed",
      hub: "http://superfeedr.com/",
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
      expect(result.leaseSeconds).to.equal(sut.opts.defaults.leaseSeconds);
    });
        
    http.client.emit("response");
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
    var params;
    params = {
      method: "POST",
      hostname: item.hub,
      headers : {
        "Content-Type" : "application/x-www-form-urlencoded"  
      }
    }; 
        
    http.request = sinon.spy(http, "request");
    sut.subscribe(item);
    expect(http.request.calledWith(params)).to.be.true;
  });

  it("should write the correct params", function () {
    var params;
        
    params = querystring.stringify({
      "hub.callback": "http://callback.com/hubabuba/?id=" + item.id,
      "hub.mode": "subscribe",
      "hub.topic": item.topic,
      "hub.lease_seconds": item.leaseSeconds
    });
    sut.subscribe(item);
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
  
  it("should populate item correctly", function () {
    var callback;
    callback = false;
    sut.subscribe(item, function (err, result) {
      callback = true;
      expect(item).to.equal(result);
    });
    
    http.client.emit("response");
    expect(callback).to.be.true;
  });
   
  
});
