/* jshint expr: true */
"use strict";

var expect = require("chai").expect
  , sinon = require("sinon")
  , querystring = require("querystring")
  , http = require("./fakehttp")
  , HubabubaItem = require("../lib/item")
  , Hubabuba = require("../");

describe("when handling verification", function () {
  var sut, url, req, handler, verification, item;
  
  beforeEach(function () {
    verification = sinon.stub();
    url = "http://callback.com/hubabuba";
    sut = new Hubabuba(url, {
      verification : verification
    });
    
    handler = sut.handler()
                 .bind(sut);
    
    req = {
      url: "/hubabuba",
      method: "GET",
      query : { 
        "id": "1",
        "hub.mode": "subscribe",
        "hub.topic": "http://foo.com/feed",
        "hub.challenge": "123456789",
        "hub.lease_seconds": "10000"
      }
    };
    item = new HubabubaItem(req.query);
  });
  
  it("should raise error if arguments are missing", function () {
    var errorSpy = sinon.spy();
    
    req.query = {};
    sut.on("error", errorSpy);
    handler(req, http.response);
    expect(errorSpy.called).to.be.true;    
  });
  
  it("should raise error if lease is missing for subscribe", function () {
    var errorSpy = sinon.spy();
    
    delete req.query["hub.lease_seconds"];
    sut.on("error", errorSpy);
    handler(req, http.response);
    expect(errorSpy.called).to.be.true;    
  });
  
  it("should call the verification callback", function () {
    handler(req, http.response);   
    expect(verification.called).to.be.true;
  });
  
  it("should populate item correctly", function () {
    handler(req, http.response);
    expect(verification.withArgs(item).called).to.be.true;
  });
  
  describe("given verification is ok", function () {
        
    beforeEach(function () {
      http.init();
      verification.returns(true);
    });
    
    it("should respond with a 200", function () {
      handler(req, http.response);
      expect(http.response.statusCode).to.equal(200); 
    });
    
    it("should respond with the correct challenge", function () {
      handler(req, http.response);
      expect(http.response.body).to.equal(req.query["hub.challenge"]);
    });
        
    it("should raise a subscribed event for subscribe mode", function () {
      var callback;
      callback = false;
      sut.on("subscribed", function (result) {
        callback = true;
        expect(result).to.deep.equal(item);
      });
      
      handler(req, http.response);
      expect(callback).to.be.true;
    });
    
    it("should raise an unsubscribed event for unsubscribe mode", function () {
      var callback;
      callback = false;
      req.query["hub.mode"] = "unsubscribe";
      item.mode = "unsubscribe";
      sut.on("unsubscribed", function (result) {
        callback = true;
        expect(result).to.deep.equal(item);
      });
      handler(req, http.response);
      expect(callback).to.be.true;
    });
  });
  
  describe("given verification fails", function () {
    
    beforeEach(function () {
      http.init();
      verification.returns(false);
    });
    
    it("should respond with a 500", function () {
      handler(req, http.response);
      expect(http.response.statusCode).to.equal(500); 
    });
    
    it("should not raise subscribed event for subscribe mode", function () {
      var callback;
      callback = false;
      sut.on("subscribed", function () {
        callback = true;
      });
      
      handler(req, http.response);
      expect(callback).to.be.false;
    });
    
    it("should not raise unsubscribed event for unsubscribe mode", function () {
      var callback;
      callback = false;
      req.query["hub.mode"] = "unsubscribe";
      item.mode = "unsubscribe";
      sut.on("unsubscribed", function () {
        callback = true;
      });
      handler(req, http.response);
      expect(callback).to.be.false;
    });
    
  });
     
});