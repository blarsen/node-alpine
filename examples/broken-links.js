/*
  This program reads one or more httpd log files (specified on the command line) and generates CSV output
  containing all requests with a referer and status 404, i.e. broken links.
 */

var fs = require('fs');
var Alpine = require('alpine');
var alpine = new Alpine();

var files = process.argv.splice(2);

files.forEach(function(file){
    alpine.parseReadStream(fs.createReadStream(file, {encoding: "utf8"}),
        function(data) {
            if (data.status == 404 && data["RequestHeader Referer"] != "-") {
                console.log(data["RequestHeader Referer"]+";"+data.request);
            }

        }
    );
})


