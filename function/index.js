'use strict';

var http = require('http'),
	inspect = require('util').inspect;

var Busboy = require('busboy');
var vision = require('@google-cloud/vision')();
var language = require('@google-cloud/language')();
var jimp = require('jimp');
var async = require("async");

exports.selfier = function selfier (req, res) {

	var busboy = new Busboy({ headers: req.headers });

	var imageByteArray = [];
	var comment = "";

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);

		file.on('data', function(data) {
			console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
			imageByteArray.push(data);
		});

		file.on('end', function() {
			console.log('File [' + fieldname + '] Finished');
		});
	});

	busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
		console.log('Field [' + fieldname + ']: value: ' + inspect(val));
		comment = val;
	});

	busboy.on('finish', function() {
		console.log('Done parsing form!');

		var commentSentiment;

		language.detectSentiment(comment).then(function(data) {
			commentSentiment = data;

			var base64Image = Buffer.concat(imageByteArray).toString('base64');

			var annotateImageReq = {
				'image':{'content':base64Image},
				'features':[{'type':'FACE_DETECTION','maxResults':'3'}]
			}

			vision.annotate(annotateImageReq,function(err,annotations, apiResponse) {

				jimp.read(Buffer.concat(imageByteArray), function(err, image) {
					if(err) {
						res.writeHead(500,{'Access-Control-Allow-Origin':'*'})
						res.write(JSON.stringify(err));
						res.end();
						return;
					}

					if(commentSentiment[0] >= 0) {
						image = image.normalize().posterize(10).brightness(0.3).contrast(0.5);
					} else {
						image = image.greyscale();
					}

					async.each(annotations[0].faceAnnotations, function(annotation, callback) {
						if(annotation.joyLikelihood != "VERY_UNLIKELY") {
							console.log("Someone seems joyful here.");
							jimp.read("https://storage.googleapis.com/noovle-gcf-demo-static/img/sun.png", function(err, sunImage) {
								sunImage = sunImage.resize(annotation.fdBoundingPoly.vertices[1].x - annotation.fdBoundingPoly.vertices[0].x, jimp.AUTO);
								image = image.composite(sunImage,annotation.fdBoundingPoly.vertices[0].x,annotation.fdBoundingPoly.vertices[0].y - sunImage.bitmap.height);
								callback();
							})
						} else if(annotation.angerLikelihood != "VERY_UNLIKELY") {
							console.log("Someone seems angry here.");
							jimp.read("https://storage.googleapis.com/noovle-gcf-demo-static/img/rain.png", function(err, rainImage) {
								rainImage = rainImage.resize(annotation.fdBoundingPoly.vertices[1].x - annotation.fdBoundingPoly.vertices[0].x, jimp.AUTO);
								image = image.composite(rainImage,annotation.fdBoundingPoly.vertices[0].x,annotation.fdBoundingPoly.vertices[0].y - rainImage.bitmap.height);
								callback();
							})
						}
					}, function(err) {
						image = image.resize(512,jimp.AUTO);

						image.getBase64(jimp.MIME_PNG, function(err, base64Response) {
							if(err) {
								res.writeHead(500,{'Access-Control-Allow-Origin':'*'})
								res.write(JSON.stringify(err));
								res.end();
								return;
							}

							res.writeHead(200,{'Access-Control-Allow-Origin':'*'})
							res.write(base64Response);
							res.end();
						});
					});
				});				
			});
		});
	});

	req.pipe(busboy);
};