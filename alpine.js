/**
 *
 * Alpine, the Apache Log Parser
 *
 * Created by blarsen on 02.10.14.
 */

// TODO code cleanup, consistent commenting, possibly break into more modules
// TODO bundle this up as a real module (package.json, readme.md etc) and commit it to Github

/*
 Notes and questions stemming from a reading of the mod_log spec:

 - Should we accept non-whitespace literal text in logs? If so, what should we do with it?
   Or should we just make it an requirement that the only non-header content be whitespaces and double quotes?
   (If we do this we won't be able to parse the "Referer log format" which contains ->)
 - If we accept non-whitespace/quote text we will have to support \n, \t, quoted quotes and backslashes, and  %%, i.e. a quoted percentage sign
  - We will probably aim for support for httpd 2.0.46 which has quoting of %r, %i and %o - previous versions logged
   the raw content of the values making logs hard to parse


  */

var Buffer = require('./buffer');

var byline = require('byline');
var _ = require("underscore.string");
var through2 = require('through2');

var Alpine = function (logformat) {

    this.LOGFORMATS = LOGFORMATS;
    this.setLogFormat = setLogFormat;
    this.getLogFormat = getLogFormat;
    this.parseLine = parseLine;
    this.getObjectStream = getObjectStream;
    this.getStringStream = getStringStream;
    this.parseReadStream = parseReadStream;

    if (logformat)
        this.setLogFormat(logformat);
    else
        this.setLogFormat(this.LOGFORMATS.COMBINED);

};

function getObjectStream() {
    var thisAlpine = this;
    return through2.obj(function(chunk, enc, callback) {
        var data = thisAlpine.parseLine(chunk);
        this.push(data);
        callback();
    });
}

function getStringStream() {
    var thisAlpine = this;
    return through2.obj(function(chunk, enc, callback) {
        var data = thisAlpine.parseLine(chunk);
        this.push(JSON.stringify(data));
        callback();
    });
}

function parseReadStream(stream, callback) {
    var thisAlpine = this;
    var stream = byline.createStream(stream);
    stream.pipe(through2.obj(function(chunk, enc, t2callback) {
        var data = thisAlpine.parseLine(chunk.toString());
        callback(data);
        t2callback();
    }))
}

function getLogFormat() {
    return this.logformat;
}

function setLogFormat(logformat) {
    this.logformat = logformat;
    this.formatfields = parseLogFormat(logformat);
}

function parseLine(line) {
    var result = {
        originalLine: line
    };

    var buf = new Buffer(line, 0);

    this.formatfields.forEach(function(field) {
        buf.skipSpaces();
        var val;
        if (field.isQuoted) {
            if (!(buf.lookingAt() === '"'))
                throw new Error("Field defined as quoted was not quoted");
            buf.skip();
            val = buf.getUpto('"');
            buf.skip();
        } else if (field.isDate) {
            if (!(buf.lookingAt() === '['))
                throw new Error("Time field is not enclosed in brackets");
            buf.skip();
            val = buf.getUpto(']');
            buf.skip();
        } else {
            val = buf.getUpto(' ');
        }
        result[field.name] = val;
    })

    return result;
}

function parseLogFormat(logformat) {
    var fields = [];
    var buf = new Buffer(logformat, 0);
    while (buf.hasMore()) {
        buf.skipSpaces();
        var field = buf.getUpto(" ");
        var isQuoted = field[0] === '"';
        var field = stripQuotes(field);

        // Check that this is a field definition (starting with %) and remove the prefix
        if (!(field[0] === "%"))
            throw new Error("Field does not start with %: "+field);
        field = field.substring(1);

        // Remove modifiers
        if (field.indexOf("{") > 0) {
            field = field.replace(/^[0-9!]+//g, "");
        }
        field = field.replace(/[<>]/g, "");

        var fieldName = FIELDS[field];

        // Handle parameterized fields
        if (field.indexOf('{') >= 0) {
            var matches = (/{(.*)}(.*)/).exec(field);
            var value = matches[1];
            var field = matches[2];
            if (!PARAMFIELDS[field])
                throw new Error("The field "+field+" should not be parameterized");
            fieldName = PARAMFIELDS[field] + ' ' + value;
        }

        field = field.replace(/{.*}/g, "{...}");
        if (!FIELDS[field])
            throw new Error("Unknown log format field "+field);
        fields.push({
            field: field,
            name: fieldName,
            isQuoted: isQuoted,
            isDate: field === 't'
        });
    }
    return fields;
}

function stripQuotes(text) {
    if ((_.startsWith(text, '"') && _.endsWith(text, '"'))
    || (_.startsWith(text, '[')) && _.endsWith(text, ']'))
        return text.substr(1, text.length-2);
    return text;
}

var LOGFORMATS = {
    COMBINED: "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-agent}i\"",
    CLF: "%h %l %u %t \"%r\" %>s %b",
    CLF_VHOST: "%v %h %l %u %t \"%r\" %>s %b"
}

var FIELDS = {
    'a': 'remoteIP',
    'A': 'localIP',
    'B': 'size',
    'b': 'sizeCLF',
    'D': 'serveTime',
    'f': 'filename',
    'h': 'remoteHost',
    'H': 'requestProtocol',
    'k': 'keepaliveRequests',
    'l': 'logname',
    'm': 'requestMethod',
    'p': 'port',
    'P': 'pid',
    'q': 'queryString',
    'r': 'request',
    'R': 'responseHandler',
    's': 'status',
    't': 'time',
    'T': 'serveTime',
    'u': 'remoteUser',
    'U': 'urlPath',
    'v': 'canonicalServerName',
    'V': 'serverName',
    'X': 'connectionStatus',
    'I': 'bytesReceived',
    'O': 'bytesSent',
    'C': 'cookie',
    'e': 'environment',
    'i': 'requestHeader',
    'n': 'note',
    'o': 'responseHeader',
    'p': 'formatPort',
    'P': 'pidFormat',
    '^ti': 'requestTrailerLine',
    '^to': 'responseTrailerLine'
}

PARAMFIELDS = {
    "c": "Cookie",
    "e": "Environment",
    "i": "RequestHeader",
    "n": "Note",
    "o": "ResponseHeader",
    "p": "Port",
    "P": "PID",
    "t": "Time",
    '^ti': 'RequestTrailerLine',
    '^to': 'ResponseTrailerLine'
}


module.exports = Alpine;
