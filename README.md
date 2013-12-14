# hubabuba 

A client library to help making working with pubsubhub a little easier, this library is being built to work off the [0.4 working draft](https://superfeedr-misc.s3.amazonaws.com/pubsubhubbub-core-0.4.html)
that is now supported by the 2 major pubsubhubub providers [google](https://pubsubhubbub.appspot.com) and [superfeedr](http://superfeedr.com/)

In keeping with the 0.4 working draft this library does not assume what format the data is that is being subscribed to so there is 
no parsing as ATOM or RSS, this way you can use it for other formats. There are plenty of other modules that are specifically built
to parse in a particular format.

The handling side uses connect so that you can plug it into an existing connect/express application.

## Installation

```bash
npm install hubabuba
```

## Dependencies

 - [Connect](https://github.com/senchalabs/connect)
 - [Extend](https://github.com/justmoon/node-extend)

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