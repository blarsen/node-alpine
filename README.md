#Alpine

`alpine` is a parser for Apache mod_log log files. It supports the three most common log formats (the Common Log Format, CLF, Common Log Format with vhosts and Combined log format)
and also allows you to specify custom log formats by passing it the LogFormat string used to generate the log file you want parsed.

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
{ originalLine: 'www.brain-salad.com 403 4321',
  remoteHost: 'www.brain-salad.com',
  status: '403',
  size: '4321' }
```

### Parse file in combined log format with callbacks
 ```js
var Alpine = require('alpine');
var alpine = new Alpine();
alpine.parseReadStream(fs.createReadStream('access_log.1', {encoding: "utf8"}), function(data) {
  console.log("Status: " + data.status + ", request: " + data.request);
});
 ```

### Use streams
Alpine supports duplex streaming, but the stream it reads from must be a per-line stream, as implemented by the byline module.

- Alpine().getObjectStream() returns a duplex stream that will write parsed objects.
- Alpine().getStringStream() returns a duplex stream that will write the same parsed objects, but stringified

```js
var Alpine = require('alpine');
byline.createStream(fs.createReadStream('access_log.1', {encoding: "utf8"}))
  .pipe(new Alpine().getStringStream())
  .pipe(fs.createWriteStream("access.out"));
```



## Restrictions

Alpine assumes that the log format contains fields, quotation marks and whitespace. Further literal text is not supported.




