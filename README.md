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

(The MIT License)

Copyright (c) 2013 Mike Cromwell and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the 'Software'), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.