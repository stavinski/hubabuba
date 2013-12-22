/* jshint expr: true */
"use strict";

var expect = require("chai").expect
  , sinon = require("sinon")
  , mockery = require("mockery")
  , Hubabuba = require("../");
  
describe("when handling a notification", function () {
  var sut, url, req, res, nextSpy, handler, http;
  beforeEach(function () {
    mockery.enable();
    mockery.registerSubstitute("http", "./test/fakehttp");
    mockery.registerAllowable('./fakehttp');
    
    http = require("./fakehttp");
    http.init();
        
    nextSpy = sinon.spy();
    url = "http://callback.com/hubabuba";
    sut = new Hubabuba(url, {
      maxNotificationSize: 100
    });
    handler = sut.handler().bind(sut);
    res = {
      writeHead : sinon.spy(),
      end : sinon.spy()
    };
    req = http.request();
    req.url = "/hubabuba";
    req.method = "POST";
    req.query = { id : "1" };
    req.headers = {
        "content-length": 10,
        link: "<http://pubsubhubbub.superfeedr.com>; rel=\"hub\",<http://blog.superfeedr.com/my-resource>; rel=\"self\""
    };
  });
  
  afterEach(function () {
    mockery.deregisterSubstitute("http", "./test/fakehttp");
    mockery.deregisterSubstitute("https", "./test/fakehttp");  
    mockery.disable();
  });
  
  it("should raise error if id not supplied", function () {
    var errorSpy = sinon.spy();
    delete req.query.id;
    sut.on("error", errorSpy);
    handler(req, res, nextSpy);
    expect(errorSpy.called).to.be.true;
  });
  
  it("should raise error if content length header is larger than max size", function () {
    var errorSpy = sinon.spy();
    req.headers["content-length"] = 101;
    sut.on("error", errorSpy);
    handler(req, res, nextSpy);
    expect(errorSpy.called).to.be.true;
  });
  
  it("should respond with 413 if content length header is larger than max size", function () {
    var errorSpy = sinon.spy();
    req.headers["content-length"] = 101;
    sut.on("error", errorSpy);
    handler(req, res, nextSpy);
    expect(res.writeHead.withArgs(413).called).to.be.true;
  });
  
  it("should raise error if actual data is larger than max size", function () {
    var errorSpy = sinon.spy();
    sut.on("error", errorSpy);
    handler(req, res, nextSpy);
    req.emit("data", new Array(200).join("#"));
    req.emit("end");
    expect(errorSpy.called).to.be.true;
  });
    
  it("should respond with a 200", function () {
    handler(req, res, nextSpy);
    req.emit("end");
    expect(res.writeHead.withArgs(200).called).to.be.true;
  });
  
  it("should raise the notification event", function () {
    var notificationSpy = sinon.spy();
    sut.on("notification", notificationSpy);
    handler(req, res, nextSpy);
    req.emit("end");
    expect(notificationSpy.called).to.be.true;
  });
  
  it("should populate the event item correctly", function () {
    sut.on("notification", function (item) {
      expect(item).to.be.deep.equal({
        id: req.query.id,
        topic: "http://blog.superfeedr.com/my-resource",
        hub: "http://pubsubhubbub.superfeedr.com",
        headers: req.headers,
        params: req.query,
        content : "",
      });
    });
    handler(req, res, nextSpy);
    req.emit("end");
  });
});

describe("given secret is being used", function () {
  var sut, url, req, res, nextSpy, handler, http;
  
  beforeEach(function () {
    mockery.enable();
    mockery.registerSubstitute("http", "./test/fakehttp");
    mockery.registerAllowable('./fakehttp');
    
    http = require("./fakehttp");
    http.init();
        
    nextSpy = sinon.spy();
    url = "http://callback.com/hubabuba";
    sut = new Hubabuba(url, {
      secret: "bubblegum",
      maxNotificationSize: 100
    });
    handler = sut.handler().bind(sut);
    res = {
      writeHead : sinon.spy(),
      end : sinon.spy()
    };
    req = http.request();
    req.url = "/hubabuba";
    req.method = "POST";
    req.query = { id : "1" };
    req.headers = {
        "content-length": 10,
        link: "<http://pubsubhubbub.superfeedr.com>; rel=\"hub\",<http://blog.superfeedr.com/my-resource>; rel=\"self\""
    };
  });
  
  afterEach(function () {
    mockery.deregisterSubstitute("http", "./test/fakehttp");
    mockery.deregisterSubstitute("https", "./test/fakehttp");  
    mockery.disable();
  });
  
  describe("when handling a notification", function () {
      
    it("should not raise notification event if secret header not supplied", function () {
      var notificationSpy = sinon.spy();
      sut.on("notification", notificationSpy);
      handler(req, res, nextSpy);
      req.emit("end");
      expect(notificationSpy.called).to.be.false;
    });
    
    it("should respond with a 200 if signature header not supplied", function () {
      handler(req, res, nextSpy);
      req.emit("end");
      expect(res.writeHead.withArgs(200).called).to.be.true;
    });
    
    it("should raise error if signature does not match", function () {
      var errorSpy = sinon.spy();
      sut.on("error", errorSpy);
      req.headers["x-hub-signature"] = "sha1=garbage";
      handler(req, res, nextSpy);
      req.emit("end");
      expect(errorSpy.called).to.be.true;
    });
    
    it("should not raise notification event if signature does not match", function () {
      var errorSpy = sinon.spy();
      sut.on("error", errorSpy);
      var notificationSpy = sinon.spy();
      sut.on("notification", notificationSpy);
      req.headers["x-hub-signature"] = "sha1=garbage";
      handler(req, res, nextSpy);
      req.emit("end");
      expect(notificationSpy.called).to.be.false;
    });
    
    it("should raise notification event if signature is valid", function () {
       var errorSpy = sinon.spy();
      sut.on("error", errorSpy);
      var notificationSpy = sinon.spy();
      sut.on("notification", notificationSpy);
      req.headers["x-hub-signature"] = "sha1=d64c7a122da89acd498822f67ca7b4b62b089302";
      handler(req, res, nextSpy);
      req.emit("end");
      expect(notificationSpy.called).to.be.true;
    });     
    
  });
});
