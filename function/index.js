'use strict';

var http = require('http'),
	inspect = require('util').inspect;

var Busboy = require('busboy');
var vision = require('@google-cloud/vision')();
var jimp = require('jimp');

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

				console.log("Mime Type: ", mimetype);

				jimp.read(Buffer.concat(imageByteArray), function(err, image) {
					if(err) {
						res.writeHead(500,{'Access-Control-Allow-Origin':'*'})
						res.write(JSON.stringify(err));
						res.end();
					} else {

						image.greyscale().getBase64(jimp.MIME_PNG, function(err, base64Response) {
							if(err) {
								res.writeHead(500,{'Access-Control-Allow-Origin':'*'})
								res.write(JSON.stringify(err));
								res.end();
							} else {
								console.log(base64Response);
								res.writeHead(200,{'Access-Control-Allow-Origin':'*'})
								res.write(base64Response);
								res.end();
							}
						});

						
					}
				})				
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