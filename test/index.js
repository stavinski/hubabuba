/* jshint expr: true */
"use strict";

var expect = require("chai").expect
  , sinon = require("sinon")
  , Hubabuba = require("../");

describe("Hubabuba definition", function () {
  var sut, url;
  url = "http://callback.com/fubar";
  
  it("should have public methods defined", function () {
    sut = new Hubabuba(url); 
    expect(sut.handler).to.exist;
    expect(sut.subscribe).to.exist;
    expect(sut.unsubscribe).to.exist;
  });
  
  it("should have correct options", function () {
    sut = new Hubabuba(url, {
      debug: true,
      defaults: {
        leaseSeconds: 10
      }
    });
    
    expect(sut.url).to.equal(url);
    expect(sut.opts.debug).to.be.true;
    expect(sut.opts.defaults.leaseSeconds).to.equal(10);
  });
});

describe("handling any request", function () {
  var sut, url, handler, req, res, nextSpy, errorSpy;
  
  beforeEach(function () {
    req = null;
    url = "http://callback.com/hubabuba";
    sut = new Hubabuba(url);
    handler = sut.handler()
                 .bind(sut);
    res = {
      writeHead : sinon.spy(),
      end : sinon.spy()
    };
    nextSpy = sinon.spy();
    errorSpy = sinon.spy();
  });
    
  it("should not match on incorrect url", function () {
    req = {
      url : "/foo",
      query : { "hub.mode" : "subscribe" },
      method : "GET"
    };
    handler(req, res, nextSpy);
    expect(nextSpy.called).to.be.true;
  });
  
  it("should raise error on incorrect method", function () {
    req = {
      url : "/hubabuba",
      method : "DELETE",
      query : {}
    };
    sut.on("error", errorSpy);
    handler(req, res, nextSpy);
    expect(errorSpy.called).to.be.true;
  });
  
  it("should response with 405 on incorrect method", function () {
    req = {
      url : "/hubabuba",
      method : "DELETE",
      query : {}
    };
    sut.on("error", errorSpy);
    handler(req, res, nextSpy);
    expect(res.writeHead.withArgs(405).called).to.be.true;
  });
    
  it("should raise error if GET request query undefined", function () {
    req = {
      url : "/hubabuba",
      method : "GET",
      query : {}
    };
    sut.on("error", errorSpy);
    handler(req, res, nextSpy);
    expect(errorSpy.called).to.be.true;
  });
  
  it("should respond with 400 if GET request query undefined", function () {
    req = {
      url : "/hubabuba",
      method : "GET",
      query : {}
    };
    sut.on("error", errorSpy);
    handler(req, res, nextSpy);
    expect(res.writeHead.withArgs(400).called).to.be.true;
  });
  
  it("should raise error when GET request mode not supplied", function () {
    req = {
      url : "/hubabuba",
      query : {},
      method : "GET"
    };
    sut.on("error", errorSpy);
    handler(req, res, nextSpy);
    expect(errorSpy.called).to.be.true;
  });
  
  it("should respond with 400 when GET request mode not supplied", function () {
    req = {
      url : "/hubabuba",
      query : {},
      method : "GET"
    };
    sut.on("error", errorSpy);
    handler(req, res, nextSpy);
    expect(res.writeHead.withArgs(400).called).to.be.true;
  });
  
});

