var db = require('./db');
var models = require('./models');
var utils = require('./utils');

//todo need to remove unused sessionsfrom this at some point
var sessionVoteMap = {};

function rappersAndVotesSince(date) {
	console.log("Getting rappers since: " + date)
	return models.Rapper.aggregate([
	 	{$unwind: '$wins'},
	 	{$match: {'wins.timestamp': {$gte: date}}},  
	 	{$group: {'_id':'$_id', 'name': {$first:'$name'}, 'losses': {$first:'$losses'}, 'wins':{$sum:1}}},
	 	{$unwind: '$losses'},
	 	{$match: {'losses.timestamp': {$gte: date}}},  
	 	{$group: {'_id':'$_id', 'name': {$first:'$name'}, 'losses': {$sum:1}, 'wins':{$first:'$wins'}}}
	 	]);
}

function setScoreAndSort(rappers) {
	var rappersResponse = rappers.map(function(rapper){
		return {name:rapper.name, score: rapper.wins - rapper.losses}
	});

	rappersResponse.sort(function(a,b){return a.score - b.score}).reverse();

	return rappersResponse;
}

function getAllRappers(req, res) {
	models.Rapper.aggregate([
	 	{$unwind: '$wins'},
	 	{$group: {'_id':'$_id', 'name': {$first:'$name'}, 'losses': {$first:'$losses'}, 'wins':{$sum:1}}},
	 	{$unwind: '$losses'},
	 	{$group: {'_id':'$_id', 'name': {$first:'$name'}, 'losses': {$sum:1}, 'wins':{$first:'$wins'}}}
	 	]).exec(function(err, rappers) {
		if (err) return console.error(err);
		rappersResponse = setScoreAndSort(rappers);
		res.send(200, rappersResponse);
	});
}

function getAllRappersMonth(req, res) {
	var date = new Date();
	var firstDayOfTheMonth = new Date(date.getFullYear(), date.getMonth(), 1);

	rappersAndVotesSince(firstDayOfTheMonth).exec(function(err, rappers) {
		if (err) return console.error(err);
		rappersResponse = setScoreAndSort(rappers);
		res.send(200, rappersResponse);
	});
}



function getAllRappersWeek(req, res){
	function getMonday() {
		var d = new Date();
		var day = d.getDay();
		var diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
		return new Date(d.setDate(diff));
	}

	var monday = getMonday();

	rappersAndVotesSince(monday).exec(function(err, rappers) {
		if (err) return console.error(err);
		rappersResponse = setScoreAndSort(rappers);
		res.send(200, rappersResponse);
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

	console.log(req);

	var voteElement = req.body;
	var cookie = req.header('Cookie')
	var rappersToVoteFor = sessionVoteMap[cookie]
	var winner;
	var loser;

	console.log(voteElement);

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
	getTwoRandomRappers: getTwoRandomRappers,
	vote: vote
};
