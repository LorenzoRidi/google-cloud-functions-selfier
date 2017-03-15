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

		detectSentimentAndAnnotateImage(res, imageByteArray, comment, 1);

	});

	req.pipe(busboy);
};



function returnBase64Image(base64Image, res) {
	res.writeHead(200,{'Access-Control-Allow-Origin':'*'})
	res.write(base64Image);
	res.end();
}

function returnError(err, res) {
	res.writeHead(500,{'Access-Control-Allow-Origin':'*'})
	res.write(JSON.stringify(err));
	res.end();
}

function returnImage(image, res) {
	image = image.resize(512,jimp.AUTO);

	image.getBase64(jimp.MIME_PNG, function(err, base64Response) {
		if(err) {
			returnError(err, res);
			return;
		}

		returnBase64Image(base64Response, res);
	});
}

function annotateImage(res, imageByteArray, commentSentiment) {

	var base64Image = Buffer.concat(imageByteArray).toString('base64');

	var annotateImageReq = {
		'image':{'content':base64Image},
		'features':[{'type':'FACE_DETECTION','maxResults':'3'}]
	}

	vision.annotate(annotateImageReq,function(err,annotations, apiResponse) {

		jimp.read(Buffer.concat(imageByteArray), function(err, image) {
			if(err) {
				returnError(err, res);
				return;
			}

			if(commentSentiment[0] >= 0) {
				image = image.normalize().brightness(0.2).contrast(0.2);
			} else {
				image = image.greyscale();
			}

			async.each(annotations[0].faceAnnotations, function(annotation, callback) {
				if(annotation.joyLikelihood != "VERY_UNLIKELY") {
					console.log("Someone seems joyful here.");
					jimp.read("https://storage.googleapis.com/noovle-gcf-demo-static/img/sparkles.png", function(err, sunImage) {
						if(err) {
							returnError(err, res);
							return;
						}

						sunImage = sunImage.resize((annotation.fdBoundingPoly.vertices[1].x - annotation.fdBoundingPoly.vertices[0].x), jimp.AUTO);
						image = image.composite(sunImage,annotation.fdBoundingPoly.vertices[0].x,annotation.boundingPoly.vertices[0].y - (sunImage.bitmap.height / 2));
						callback();
					})
				} else if(annotation.angerLikelihood != "VERY_UNLIKELY") {
					console.log("Someone seems angry here.");
					jimp.read("https://storage.googleapis.com/noovle-gcf-demo-static/img/cloud.png", function(err, rainImage) {
						if(err) {
							returnError(err, res);
							return;
						}
						
						rainImage = rainImage.resize((annotation.fdBoundingPoly.vertices[1].x - annotation.fdBoundingPoly.vertices[0].x), jimp.AUTO);
						image = image.composite(rainImage,annotation.fdBoundingPoly.vertices[0].x,annotation.boundingPoly.vertices[0].y - (rainImage.bitmap.height / 2));
						callback();
					})
				} else {
					console.log("No facial expressions here.");
					callback();
				}
			}, function(err) {
				if(err) {
					returnError(err, res);
					return;
				}
						
				returnImage(image, res);
				return;
			});
		});				
	});
}

function detectSentimentAndAnnotateImage(res, imageByteArray, comment, retry) {
	language.detectSentiment(comment).then(function(data) {

		annotateImage(res, imageByteArray, data);

	}, function(reason) {

		if(retry < 5) {
			detectSentimentAndAnnotateImage(res, imageByteArray,comment, retry + 1);
		} else {
			returnError(reason);
		}

	});
}