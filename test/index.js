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
      url : "fubar"
    });
    
    expect(sut.opts.url).to.equal("fubar");
  });
});

describe("handling any request", function () {
  var sut, handler, req, res, nextSpy, errorSpy;
  
  beforeEach(function () {
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
  
  it("should match on correct url", function () {
    req = {
      url : "/hubabuba",
      query : { "hub.mode" : "subscribe" },
      method : "GET"
    };
    
    handler(req, res, nextSpy);
    
    expect(nextSpy.called).to.be.false;
  });
  
  it("should raise error if request query undefined", function () {
    req = {
      url : "/hubabuba",
      method : "GET"
    };
    sut.on("error", errorSpy);
    handler(req, res, nextSpy);
    expect(errorSpy.called).to.be.true;
  });
  
  it("should raise error when mode not supplied", function () {
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

describe("when denied request sent", function () {
  var sut, req, res, nextSpy, handler;
  
  beforeEach(function () {
    nextSpy = sinon.spy();
    sut = new Hubabuba();
    handler = sut.handler()
                 .bind(sut);
    res = {
      writeHead : sinon.spy(),
      end : sinon.spy()
    };
    req = {
      url : "/hubabuba",
      method : "GET",
      query : { "hub.mode" : "denied" }
    };
  });
  
  it("should raise error if arguments are missing", function () {
    var errorSpy = sinon.spy();
    
    sut.on("error", errorSpy);
    handler(req, res, nextSpy);
    expect(errorSpy.called).to.be.true;    
  });
  
  it("should raise denied event", function () {
    req.query.id = 1;
    req.query["hub.topic"] = "http://foo.com/feed";
    req.query["hub.reason"] = "just bcoz";
    
    var deniedSpy = sinon.spy();
    
    sut.on("denied", deniedSpy);
    handler(req, res, nextSpy);
    
    expect(deniedSpy.withArgs({
      id : 1,
      topic : "http://foo.com/feed",
      reason : "just bcoz"
    }).called).to.be.true;
  });
  
  it("should respond with correct response", function () {
    req.query.id = 1;
    req.query["hub.topic"] = "http://foo.com/feed";
    req.query["hub.reason"] = "just bcoz";
    handler(req, res, nextSpy);
    
    expect(res.writeHead.withArgs(200).called).to.be.true;
  });
    
});