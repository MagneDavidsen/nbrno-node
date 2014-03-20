var db = require('./db');
var models = require('./models');
var utils = require('./utils');

//todo need to remove unused sessionsfrom this at some point
var sessionVoteMap = {};

function getAllRappers(req, res) {
	models.Rapper.find().select('name wins losses').exec(function (err, rappers) {
		if (err) return console.error(err);
		var rappersResponse = rappers.map(function(rapper){
			return {name:rapper.name, score: rapper.wins.length - rapper.losses.length}
		});

		rappersResponse.sort(function(a,b){return a.score - b.score}).reverse();
		res.send(200, rappersResponse);
	})
}

function getAllRappersMonth(req, res) {

	var start = new Date()

	models.Rapper.find({"wins" : {"$elemMatch" : { timestamp: {$gte: start}}}}, {name:1, wins:1, losses:1} ), (function (err, rappers) {
		if (err) return console.error(err);
		var rappersResponse = rappers.map(function(rapper){
			return {name:rapper.name, score: rapper.wins.length - rapper.losses.length}
		});

		rappersResponse.sort(function(a,b){return a.score - b.score}).reverse();
		res.send(200, rappersResponse);
	})
}

function getAllRappersWeek(req, res){
	return "";
}

//db.rappers.aggregate(    {$match : {}},    {$unwind: "$wins"},    {$match: {"wins.timestamp": {$gte: start}}} );

//db.rappers.find({"wins" : {"$elemMatch" : { timestamp: {$gte: start, $lte: end}}}}, {name:1, wins:1, losses:1} )
//db.rappers.find({"wins" : {"$elemMatch" : { timestamp: {$gte: start}}}} , {name:1, wins:1} )
//db.rappers.find({"losses" : {"$elemMatch" : { timestamp: {$gte: start}}}} , {name:1, losses:1} )


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

function getTwoRandomRappers(req, res) {
	models.Rapper.find().select('name picture').exec(function (err, rappers) {
		if (err) return console.error(err);
		var twoRandomRappers = utils.getTwoRandomElementsFrom(rappers);

		var cookie = req.header('Cookie')
		sessionVoteMap[cookie] = {left: twoRandomRappers[0], right: twoRandomRappers[1]};

		res.send(200, {left:twoRandomRappers[0], right:twoRandomRappers[1]});
	})	
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

function vote(req, res) {

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
}

function getImg(rappername) {
	models.Rapper.findOne()
}

module.exports = {
	getAllRappers: getAllRappers,
	getAllRappersWeek: getAllRappersWeek,
	getAllRappersMonth: getAllRappersMonth,
	createRapper: createRapper,
	getTwoRandomRappers: getTwoRandomRappers,
	vote: vote
};
