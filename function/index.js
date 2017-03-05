'use strict';

var http = require('http'),
	inspect = require('util').inspect;

var Busboy = require('busboy');
var vision = require('@google-cloud/vision')();

exports.selfier = function selfier (req, res) {

	var busboy = new Busboy({ headers: req.headers });

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
		var imageByteArray = [];
		var base64Image = "";

		file.on('data', function(data) {
			console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
			imageByteArray.push(data);
		});

		file.on('end', function() {
			console.log('File [' + fieldname + '] Finished');
			base64Image = Buffer.concat(imageByteArray).toString('base64');

			var annotateImageReq = {
				'image':{'content':base64Image},
				'features':[{'type':'FACE_DETECTION','maxResults':'3'}]
			}

			vision.annotate(annotateImageReq,function(err,annotations, apiResponse) {
				console.log("err: ", JSON.stringify(err));
				console.log("annotations: ", JSON.stringify(annotations));
				console.log("apiResponse: ", JSON.stringify(apiResponse));
				res.status(200).end();
			});
		});
	});

	busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
		console.log('Field [' + fieldname + ']: value: ' + inspect(val));
	});

	busboy.on('finish', function() {
		console.log('Done parsing form!');
	});

	req.pipe(busboy);
};