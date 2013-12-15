/* jshint expr: true */
"use strict";

var expect = require("chai").expect
  , sinon = require("sinon")
  , Hubabuba = require("../");

describe("Hubabuba definition", function () {
  var sut;
  
  it("should have public methods defined", function () {
    sut = new Hubabuba(); 
    expect(sut.handler).to.exist;
    expect(sut.subscribe).to.exist;
    expect(sut.unsubscribe).to.exist;
  });
  
  it("should have correct options", function () {
    sut = new Hubabuba({
      url : "http://callback.com/fubar"
    });
    
    expect(sut.opts.url).to.equal("http://callback.com/fubar");
  });
});

describe("handling any request", function () {
  var sut, handler, req, res, nextSpy, errorSpy;
  
  beforeEach(function () {
    req = null;
    sut = new Hubabuba();
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
  
});

