var db = require('./db');
var models = require('./models');
var utils = require('./utils');

var sessionVoteMap = {};


function getAllRappers(req, res, next) {
	models.Rapper.find().select('name -_id').exec(function (err, rappers) {
		if (err) return console.error(err);
		console.log(rappers);
		res.send(200, rappers);
	})

	return next();
}

function createRapper(rapperName, imageName, imageData, imageType) {
	var rapper = new models.Rapper
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
	models.Rapper.find().select('name picture').exec(function (err, rappers) {
		if (err) return console.error(err);
		var twoRandomRappers = utils.getTwoRandomElementsFrom(rappers);

		var cookie = req.header('Cookie')

		sessionVoteMap[cookie] = {left: twoRandomRappers[0], right: twoRandomRappers[1]};

		res.send(200, {left:twoRandomRappers[0], right:twoRandomRappers[1]});
	})	

	return next();
}

function countArray(rapper, arrayName) {
	var count;
	var yo = models.Rapper.aggregate([
	    { $match: { _id: rapper._id } }, 
	    { $unwind: '$' + arrayName }, 
	    { $group: {
	          _id: ''
	        , count: { $sum: 1 }
	      }
	    }], function(err, result) {
  			return result[0].count;
  		});	
	console.log("count: " + yo.toString());
	return count;
}

function registerVote(winningRapper, losingRapper) {
	console.log("winningRapper: " + winningRapper._id)
	console.log("losingRapper: " + losingRapper._id)
	
	models.Rapper.update({_id: winningRapper._id },
		{$push: { wins : {vs: losingRapper._id} }}, {upsert:true}, function(err, data) {
			if (err) return console.error(err);
		});

	models.Rapper.update({_id: losingRapper._id },
		{$push: { losses : {vs: winningRapper._id} }}, {upsert:true}, function(err, data) {
			if (err) return console.error(err);
		});
}

function vote(req, res, next) {

	var voteElement = JSON.parse(req.body);
	var cookie = req.header('Cookie')
	var rappersToVoteFor = sessionVoteMap[cookie]
	var winner;
	var loser;

	switch(voteElement.side) {
		case "left":
			winner = rappersToVoteFor.left;
			loser = rappersToVoteFor.right;
			break;
		case "right":
			winner = rappersToVoteFor.right;
			loser = rappersToVoteFor.left;
			break;
		default:
			console.log("Something fishy is going on.")
	}
	registerVote(winner, loser)

	models.Rapper.findOne({_id: winner._id}).select('name -_id wins losses').exec(function (err, rapper) {
		if (err) return console.error(err);
		console.log(rapper);
		res.send(200, {name:rapper.name, wins:rapper.wins.length, losses:rapper.losses.length});
	});

	return next();
}

function getImg(rappername) {
	models.Rapper.findOne()
}

module.exports = {
	getAllRappers: getAllRappers,
	createRapper: createRapper,
	getRapper: getRapper,
	getTwoRandomRappers: getTwoRandomRappers,
	vote: vote
};
