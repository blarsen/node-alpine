#Alpine

`alpine` is a parser for Apache mod_log log files. It supports the three most common log formats (the Common Log Format,
the Common Log Format with a vhost field and the Combined log format)
and also allows you to specify custom log formats by passing it the LogFormat string used to generate the log file you want parsed.

## Predefined log formats

Alpine has these three predefined log formats:

- Alpine.LOGFORMATS.COMBINED
- Alpine.LOGFORMATS.CLF
- Alpine.LOGFORMATS.CLF_VHOST

that can be passed as arguments to the constructor or configured with the .setLogFormat() method.

The default log format is Alpine.LOGFORMATS.COMBINED.

## Examples

### Parse from string using custom log format
The simplest (if not all that useful) use case is
```js
var Alpine = require('alpine');
var alpine = new Alpine("%h %s %B");
var data = alpine.parseLine("www.brain-salad.com 403 4321");
console.log(data);
```

which produces

```js
{
  originalLine: 'www.brain-salad.com 403 4321',
  remoteHost: 'www.brain-salad.com',
  status: '403',
  size: '4321'
}
```

### Parse file in combined log format with callbacks
```js
var fs = require('fs')
var Alpine = require('alpine');
var alpine = new Alpine();
alpine.parseReadStream(fs.createReadStream('access_log', {encoding: "utf8"}),
  function(data) {
    console.log("Status: " + data.status + ", request: " + data.request);
  });
```

### Use streams
Alpine supports duplex streaming, but the stream it reads from must be a per-line stream, as implemented by the byline module.

- Alpine().getObjectStream() returns a duplex stream that will write parsed objects.
- Alpine().getStringStream() returns a duplex stream that will write the same parsed objects, but serialized using JSON.stringify()

```js
var fs = require('fs')
var byline = require('byline');
var Alpine = require('alpine');
byline.createStream(fs.createReadStream('access_log', {encoding: "utf8"}))
  .pipe(new Alpine().getStringStream())
  .pipe(fs.createWriteStream("access.out"));
```

## Restrictions

Alpine assumes that the log format contains fields, quotation marks (surrounding fields) and whitespace. Further literal text is not supported.

Alpine will probably only work with log files created by Apache HTTPD version 2.0.46 and later - earlier versions logged the contents
of the %r, %i and %o fields without quoting the data, making logs irregular and unpredictable.




