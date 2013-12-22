# Hubabuba 

A client library to help making working with pubsubhubbub a little easier, this library is built to off the [0.4 working draft](https://superfeedr-misc.s3.amazonaws.com/pubsubhubbub-core-0.4.html)
that is now supported by the 2 major pubsubhubbub providers [google](https://pubsubhubbub.appspot.com) and [superfeedr](http://superfeedr.com/)

In keeping with the 0.4 working draft this library does not assume what format the data is that is being subscribed to so there is 
no parsing, this way you can use it for all different manner of uses.

The handling side uses connect so that you can plug it into an existing connect/express application.

## Contents

- [Installation](#installation)
- [Dependencies](#dependencies)
- [Example Usage](#example-usage)
- [Reference](#reference)
- [FAQ's](#faqs)
- [Tests](#tests)
- [Contributors](#contributors)
- [License](#license)

## Installation

```bash
npm install hubabuba
```

## Dependencies

 - [Connect](https://github.com/senchalabs/connect)
 - [Extend](https://github.com/justmoon/node-extend)

## Example Usage

```javascript
var connect = require("connect")
  , http = require("http")
  , url = require("url")
  , Hubabuba = require("hubabuba")
  , push = new Hubabuba("http://www.myhandlersite.com/hubabuba", {
      debug : true
    });

push.on("error", console.error)
    .on("subscribed", function (item) {
      console.log("subscribed");
    })
    .on("unsubscribed", function (item) {
      console.log("unsubscribed");
    })
    .on("denied", function (item) {
      console.log("denied");
    })
    .on("notification", function (item) {
      console.log("notification");
});

var app = connect()
  .use(connect.query())
  .use(push.handler());

http.createServer(app)
    .listen(3000, function () {
      console.log("listening on port 3000");  
    });
    
push.subscribe({
    id: "123",
    topic: "http://www.someblog.com/feed",
    hub: "https://pubsubhubbub.appspot.com"
  }, function handleSubscribing(err, item) {
  if (err) {
    console.err(err);
    return;
  }
  console.log("subscribed to %s", item.topic);
});    
```

## Reference

###Hubabuba(callbackUrl, [options])

Constructor for Hubabuba, the callbackUrl must be supplied and should point to the location where the hub should send requests to.

__options__

```javascript
debug {bool} - turns on debug mode so extra details are recorded in the console to help diagnose issues
verification {function} - a function that takes the item being (un)subscribed and returns either true or false to indicate if it is valid or not
secret {string} - a string to be used as the key when using authenticated notifications, it also combined with the topic
leaseSeconds {number} - a global setting as to how many default seconds the subscription should remain active for with a hub when subscribing
maxNotificationSize {number} - the max number of bytes to accept from the notification to prevent a hub from sending huge amounts of data and tieing up the request
```

###Hubabuba.handler()

Called when registering with connect, it returns a standard connect function.

```javascript
app.use(push.handler());
```

###Hubabuba.subscribe(item, callback)

Subscribes to a hub for a specified topic, the item needs to be populated correctly.

__item__

```javascript
id {string} - a unique value that the caller can use to identify the subscription, such as database id, uuid etc...
topic {string} - the url of the topic that is being subscribed to
hub {string} - the url of the hub
[leaseSeconds] {number} - the number of seconds the subscription should remain active for
```

_leaseSeconds may or may not be changed by the hub so you should always use the returned leaseSeconds at the verification stage as 
the confirmed lease seconds_

__callback__

```javascript
function (err, item) {}
```

###Hubabuba.unsubscribe(item, callback)

Unsubscribes to a hub for a specified topic, the item needs to be populated correctly.

__item__

```javascript
id {string} - a unique value that the caller can use to identify the subscription, such as database id, uuid etc...
topic {string} - the url of the topic that is being subscribed to
hub {string} - the url of the hub
```

__callback__

```javascript
function (err, item) {}
```

###Events

__error__

Raised when an error occurs from handling a hub request, the error will be an instance of a _HubabubaError_ object, and may
or may not have a defined id property if we could retrieve it.

__denied__

Raised when the hub denies the use of a particular topic for the subscription, this can happen at anytime even after the subscription
was previously accepted.

```javascript
id {string} - the unique id for this subscription
topic {string} - the topic that this subscription is for
[reason] {string} - a description of why the subscription has been denied
```

__subscribed / unsubscribed__

Raised when confirmation of a subscription or unsubscription takes place, the argument will be an instance of a _HubabubaItem_ object.

```javascript
id {string} - the unique id for this subscription
topic {string} - the topic that this subscription is for
mode {string} - either "subscribe" or "unsubscribe"
[leaseSeconds] {number} - the number of seconds that the hub will keep the subscription active for
```

__notification__

Raised when the hub publishes content for a subscription.

```javascript
id {string} - the unique id for this subscription
topic {string} - the topic that this subscription is for
hub {string} - the publishing hub
headers {object} - a hash of the headers that were sent with the request
params {object} - a hash of the query parameters that were sent with the request
content {string} - the body content of the request
```

##FAQ's

###Q. What prevents a rogue request to the hub from (un)subscribing one of my subscriptions?

###A.

When a (un)subscription is made via __subscribe / unsubscribe__ the hub will send a request to verify the action, it is the responsibility
of the caller to determine if this is valid or not, by default hububabuba will allow any (un)subscription to go through automatically, if
you want to perform a check you use the verification property and supply a function that will return either true or false depending if
it is valid or not:

```javascript
new Hubabuba(/*callabck omitted*/, {
  verification : function (item) {
    var sub = subs.find(item.id); // find the subscription in store (redis, mongodb, mysql etc...)
    if (item.mode === modes.UNSUBSCRIBE) { // is it an unsubscribe action
      return (sub) && (sub.status === modes.AWAITING_UNSUBSCRIBE); // did we find the subscription and is it awaiting unsubscription
    }
  }
}
```

You can then determine if the action is a valid one you expect or not.

###Q. How do I keep my subscriptions from expiring?

###A.

When the subscription is confirmed a __subscribed__ event will be raised at this point the leaseSeconds property will have the number
of seconds that the hub will keep the subscription active, you can use this as a guide and by setting up a scheduled job you can
check for subscriptions that are going to expire soon and perform another subscribe, the working draft specifies that a hub must allow
this and the new subscribe will supercede the existing one.

###Q. Why is the content not formatted into atom, rss, json etc...?

###A.

One of the goals of the 0.4 working draft is that it is not dependent on a particular format this gives it a lot more power as you could
use the pubsubhubbub protocol for subscribing to any resource that can be sent over HTTP, I wanted to make hubabuba embrace this power
and by not shackling it to a particular format it can be used for any resource.

If you know that the content is going to be there are plenty of node modules that can parse the content into the required format.

###Q. Why do I get a warning when i use the secret?

###A.

A warning will be displayed if a __(un)subscribe__ is made to a hub that is not running over HTTPS this is because it is a lot less
secure as the request can be sniffed over the wire and the secret will be visible and can then be used to make fake publishes, this is
not the case when it is ran over HTTPS.

## Tests

single run:

```bash
npm test
```

watch for file changes:

```bash
npm run-script watch
```

## Contributors

  https://github.com/stavinski/hubabuba/graphs/contributors

## License

[MIT License](http://opensource.org/licenses/MIT)
