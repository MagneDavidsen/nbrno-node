var db = require('./db');
var utils = require('./utils');

function getAllRappers(req, res, next) {
	db.Rapper.find(function (err, rappers) {
  		if (err) return console.error(err);
  		console.log(rappers);
  		res.send(200, rappers);
	})

	return next();
}

function createRapper(rapperName, imageName, imageData, imageType) {
	var rapper = new db.Rapper
	rapper.name = rapperName
	rapper.picture.fileName = imageName
	rapper.picture.data = imageData.toString('base64')
	rapper.picture.contentType = imageType
	rapper.save(function (err, rapper) {
			if (err) return console.error(err);
	});
}

function getRapper(req, res, next) {
	res.send('One rapper');
	return next();
}

function getTwoRandomRappers(req, res, next) {
		db.Rapper.find(function (err, rappers) {
  		if (err) return console.error(err);
  		var twoRandomRappers = utils.getTwoRandomElementsFrom(rappers);
  		console.log("Two random rappers: " + twoRandomRappers);
  		res.send(200, twoRandomRappers);
	})

	return next();
}

function vote(req, res, next) {
	console.log(req.body);

	req.body.forEach(function(voteElement) {
		db.Rapper.update({_id: voteElement.id },
			{$push: { votes : voteElement.vote }}, {upsert:true}, function(err, data) {
				if (err) return console.error(err);
			});
	});

	res.send(200);
	return next();
}

function getImg(rappername) {
	db.Rapper.findOne()
}

module.exports = {
  getAllRappers: getAllRappers,
  createRapper: createRapper,
  getRapper: getRapper,
  getTwoRandomRappers: getTwoRandomRappers,
  vote: vote
};
