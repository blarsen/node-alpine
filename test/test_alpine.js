/**
 * Created by blarsen on 03.10.14.
 */


var Alpine = require("../alpine");
var assert = require('assert');
var fs = require('fs');
var byline = require('byline');
var StringReader = require('../stringreader');

describe('Alpine', function () {

    it("should have predefined log formats", function () {
        assert(Alpine.LOGFORMATS.COMBINED, "No combined log format");
        assert(Alpine.LOGFORMATS.CLF, "No common log format");
        assert(Alpine.LOGFORMATS.CLF_VHOST, "No common log format with vhosts");
    })

    it("should let me specify a log format", function () {
        var a = new Alpine("%h");
        assert(a.getLogFormat() == "%h");
    })

    it("should default to COMBINED log format", function () {
        var a = new Alpine();
        assert(a.getLogFormat() == Alpine.LOGFORMATS.COMBINED);
    })

    it("should allow me to set the log format programatically", function () {
        var a = new Alpine();
        a.setLogFormat("%h %r");
        assert(a.getLogFormat() === "%h %r");
    })

    it("should throw an error when it receives an unknown log format field", function () {
        var a = new Alpine();
        try {
            a.setLogFormat("No computer stands in my way");
        } catch (err) {
            return;
        }
        throw new Error("Did not get expected exception");
    })

    it("should handle single-field formats correctly", function () {
        var a = new Alpine("%h");
        var result = a.parseLine("foo.bar.baz");
        assert(result.remoteHost == "foo.bar.baz");
    })

    it("should handle two-field formats correctly", function () {
        var a = new Alpine("%h %a");
        var result = a.parseLine("foo.bar.baz 129.240.2.40");
        assert(result.remoteHost == "foo.bar.baz");
        assert(result.remoteIP == "129.240.2.40");
    })

    it("should handle quoted fields correctly", function () {
        var a = new Alpine("\"%h\"");
        var result = a.parseLine("\"foo.bar.baz\"");
        assert(result.remoteHost == "foo.bar.baz", "Wrong remotehost: " + result.remoteHost);
    })

    it("should handle quoted quotes in the request field correctly", function() {
        var a = new Alpine("\"%r\"");
        var result = a.parseLine('"a\\"quoted quote"');
        assert(result.request == 'a\\"quoted quote');
    })

    it("should handle the time field correctly", function () {
        var a = new Alpine("%t");
        var result = a.parseLine("[01/Oct/2014:04:05:11 +0200]");
        assert(result.time == "01/Oct/2014:04:05:11 +0200", "Wrong time: " + result.time);
    })

    it("should handle a combined log format line correctly", function () {
        var a = new Alpine();
        var result = a.parseLine(
            '109.247.114.201 - - [01/Oct/2014:12:19:00 +0200] "GET /altibox/js/commons/jquery.xml2json.js?_=1412158740334 HTTP/1.1" 200 2701 "https://www.sfjbb.no/" "Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12A365 Safari/600.1.4"'
        );

        assert(result.remoteHost === "109.247.114.201");
        assert(result['RequestHeader User-agent'] === "Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12A365 Safari/600.1.4");
        assert(result['RequestHeader Referer'] === "https://www.sfjbb.no/");
        assert(result.sizeCLF === "2701", "Wrong size: " + result.sizeCLF);
    })

    it("should let me serve it a readstream and do per-line callbacks", function(done) {
        var a = new Alpine("%h");
        var sr = new StringReader("foo.bar.baz\nwww.uio.no\nwww.altibox.no");
        var lines = 0;
        a.parseReadStream(sr, function(data) {
            lines++;
            if (lines == 1)
                assert(data.remoteHost === "foo.bar.baz")
            else if (lines == 2)
                assert(data.remoteHost === "www.uio.no")
            else if (lines == 3)
                assert(data.remoteHost === "www.altibox.no")

            if (lines == 3) {
                done();
            }
        })
    })

/*  Normally disabled since it does I/O
    it("should do magic", function() {

 byline.createStream(fs.createReadStream('access_log.1', {encoding: "utf8"}))
 .pipe(new Alpine().getStringStream())
 .pipe(fs.createWriteStream("a.out"));

 })
*/

})
