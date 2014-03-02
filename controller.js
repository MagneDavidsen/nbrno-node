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

function createRapper(req, res, next) {
	var rapper = new db.Rapper(req.body)
	rapper.save(function (err, rapper) {
  		if (err) return console.error(err);
	});

	res.send(200);
	return next();
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
	res.send('Vote');
	return next();
}

module.exports = {
  getAllRappers: getAllRappers,
  createRapper: createRapper,
  getRapper: getRapper,
  getTwoRandomRappers: getTwoRandomRappers,
  vote: vote
};
