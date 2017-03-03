'use strict';

var multiparty = require('multiparty');
var util = require('util');
var gcloud = require('google-cloud');

exports.selfier = function selfier (req, res) {
  
	var form = new multiparty.Form();

	form.on('part', function(part) {
		if(part.filename) {
			console.log(part.read().toString('base64'));
		}
		part.resume();
	})

    form.parse(req, function(err, fields, files) {
      res.writeHead(200, {'content-type': 'text/plain'});
      res.write('received upload:\n\n');
      res.end(util.inspect({fields: fields, files: files}));
    });

};