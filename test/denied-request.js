/* jshint expr: true */
"use strict";

var expect = require("chai").expect
  , sinon = require("sinon")
  , Hubabuba = require("../");

describe("when handling denied", function () {
  var sut, url, req, res, nextSpy, handler;
  
  beforeEach(function () {
    nextSpy = sinon.spy();
    url = "http://callback.com/hubabuba";
    sut = new Hubabuba(url);
    handler = sut.handler()
                 .bind(sut);
    res = {
      writeHead : sinon.spy(),
      end : sinon.spy()
    };
    req = {
      url : "http://callback.com/hubabuba",
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
    expect(res.end.called).to.be.true;
  });
    
});