/**
 * Created by blarsen on 03.10.14.
 */

var Buffer = require("../buffer");
var assert = require('assert');

describe('Buffer', function () {
    var buf;

    before(function () {
        buf = new Buffer("a b", 0);
    })

    it("should handle basic functions ok", function () {
        var xbuf = new Buffer("a b c", 0);
        assert(xbuf.remaining() == 5);
        assert(xbuf.hasMore());
        assert(xbuf.getUpto(" ") === "a");
        assert(xbuf.remaining() == 4);
        xbuf.skipSpaces();
        assert(xbuf.remaining() == 3);
        assert(xbuf.getUpto("x") === "b c");
        assert(!xbuf.hasMore());
        assert(xbuf.remaining() == 0);
        assert(xbuf.getUpto('x') === undefined);
    })

    it("should be good at looking, skipping and rewinding", function () {
        var xbuf = new Buffer("abcdef", 0);
        assert(xbuf.lookingAt() === "a", "It doesn't know what it's looking at");
        xbuf.skip(1);
        assert(xbuf.lookingAt() === "b");
        xbuf.skip(2);
        assert(xbuf.lookingAt() === "d");
        xbuf.skip(12);
        assert(!xbuf.hasMore());
        xbuf.rewind();
        assert(xbuf.lookingAt() == "a");


    })

})
