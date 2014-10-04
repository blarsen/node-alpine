/**
 * Created by blarsen on 03.10.14.
 */

var util = require('util');
var Readable = require('stream').Readable;
var Buffer = require('buffer').Buffer;

function StringReader(str) {
    Readable.call(this);
    this.data = str;
}

util.inherits(StringReader, Readable);

module.exports = StringReader;

StringReader.prototype._read =function(n) {
    this.push(this.data);
    this.push(null);
}