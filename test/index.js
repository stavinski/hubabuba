/* jshint expr: true */
"use strict";

var expect = require("chai").expect
  , sinon = require("sinon")
  , querystring = require("querystring")
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

describe("when denied request received", function () {
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
    expect(res.end.called).to.be.true;
  });
    
});

describe("when subscribing", function () {
  var sut, request, http, https, item, requestCallback, stub, write;
  
  beforeEach(function () {
    sut = new Hubabuba({
      url: "http://callback.com/hubabuba"
    });
    http = require("http");
    https = require("https");
    http.request = sinon.stub(http, "request");    
    https.request = sinon.stub(https, "request");    
      
    write = sinon.spy();
    stub = {
      write : write,
      end : sinon.stub()
    };
        
    http.request.returns(stub);
    https.request.returns(stub);
      
    item = {
      id: "123456789",
      topic: "http://foo.com/feed",
      hub: "http://superfeedr.com/",
      leaseSeconds: 10000
    }; 
  });
  
  afterEach(function () {
    http.request.restore();
    https.request.restore();
  });
  
  it("should use defaults for missing items", function () {
    item.leaseSeconds = undefined;    
    http.request.callsArg(1);
    
    sut.subscribe(item, function (err, result) {
      expect(result).to.exist;
      expect(result.leaseSeconds).to.equal(sut.opts.defaults.leaseSeconds);
    });
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
  
  it("should use http protocol for insecure hub", function () {
    sut.subscribe(item);
    expect(http.request.called).to.be.true;
  });
  
  it("should use https protocol for secure hub", function () {
    item.hub = "https://superfeedr.com/",
    
    sut.subscribe(item);
    expect(https.request.called).to.be.true;
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
    
    expect(write.calledWith(params)).to.be.true;
  });
  
  it("should callback with error if request returned error");
  it("should populate item correctly");
  
});
