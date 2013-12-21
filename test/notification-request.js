/* jshint expr: true */
"use strict";

var expect = require("chai").expect
  , sinon = require("sinon")
  , Hubabuba = require("../");

  
describe("when handling a notification", function () {
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
      url : "/hubabuba",
      method : "POST",
      query: { id : "1" },
      headers: {
        link: "<http://pubsubhubbub.superfeedr.com>; rel=\"hub\",<http://blog.superfeedr.com/my-resource>; rel=\"self\""
      }
    };
  });
  
  it("should raise error if id not supplied", function () {
    var errorSpy = sinon.spy();
    delete req.query.id;
    sut.on("error", errorSpy);
    handler(req, res, nextSpy);
    expect(errorSpy.called).to.be.true;
  });
    
  it("should respond with a 200", function () {
    handler(req, res, nextSpy);
    expect(res.writeHead.withArgs(200).called).to.be.true;
  });
  
  it("should raise the notification event", function () {
    var notificationSpy = sinon.spy();
    sut.on("notification", notificationSpy);
    handler(req, res, nextSpy);
    
    expect(notificationSpy.called).to.be.true;
  });
  
  it("should populate the event item correctly", function () {
    sut.on("notification", function (item) {
      expect(item).to.be.deep.equal({
        id: req.query.id,
        topic: "http://blog.superfeedr.com/my-resource",
        hub: "http://pubsubhubbub.superfeedr.com",
        request : req
      });
    });
    handler(req, res, nextSpy);
  });
});

describe("given secret is being used", function () {
  var sut, url, req, res, nextSpy, handler;
  
  describe("when handling a notification", function () {
    beforeEach(function () {
      nextSpy = sinon.spy();
      url = "http://callback.com/hubabuba";
      sut = new Hubabuba(url, { secret: "bubblegum" });
      handler = sut.handler()
                   .bind(sut);
      res = {
        writeHead : sinon.spy(),
        end : sinon.spy()
      };
      req = {
        url : "/hubabuba",
        method : "POST",
        query: { id : "1" },
        headers: {
          link: "<https://pubsubhubbub.superfeedr.com>; rel=\"hub\",<http://blog.superfeedr.com/my-resource>; rel=\"self\""
        }
      };
    });
  
    it("should not raise notification event if secret header not supplied");
    it("should respond with a 200 if signature header not supplied");
    it("should not raise notification event if signature does not match");
    it("should raise notification event if signature is valid");     
    
  });
});
