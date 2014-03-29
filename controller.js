var db = require('./db');
var models = require('./models');
var utils = require('./utils');
var NodeCache = require( "node-cache" );

var fiveMinutes =  60 * 10;

var sessionVoteMap = new NodeCache( { stdTTL: fiveMinutes , checkperiod: fiveMinutes } );
var dbCache = new NodeCache( { stdTTL: fiveMinutes , checkperiod: fiveMinutes } );

function rappersAndVotesSince(date) {
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

function returnRapperListResponse(res, rappers){
	res.send(200, rappers.slice(0, 10));
}

function getAllRappers(req, res) {
	var allRappers;
	dbCache.get("allRappers", function( err, value ){
  		if (err) return console.error(err);
    	allRappers = value["allRappers"];
	});

	if(allRappers){
		returnRapperListResponse(res, allRappers);
	} else {
		console.time("db.getAllRappers");
		models.Rapper.aggregate([
		 	{$unwind: '$wins'},
		 	{$group: {'_id':'$_id', 'name': {$first:'$name'}, 'losses': {$first:'$losses'}, 'wins':{$sum:1}}},
		 	{$unwind: '$losses'},
		 	{$group: {'_id':'$_id', 'name': {$first:'$name'}, 'losses': {$sum:1}, 'wins':{$first:'$wins'}}}
		 	]).exec(function(err, rappers) {
			if (err) return console.error(err);
			console.timeEnd("db.getAllRappers");
			rappersResponse = setScoreAndSort(rappers);

			dbCache.set("allRappers", rappersResponse, function(err, success ){
				if (err) return console.error(err);
			});

			returnRapperListResponse(res, rappersResponse);
		});
	}
}

function getAllRappersMonth(req, res) {
	var date = new Date();
	var firstDayOfTheMonth = new Date(date.getFullYear(), date.getMonth(), 1);
	
	var monthRappers;

	dbCache.get("monthRappers", function( err, value ){
  		if (err) return console.error(err);
    	monthRappers = value["monthRappers"];
	});

	if(monthRappers){
		returnRapperListResponse(res, monthRappers);
	} else{

		console.time("db.getMonthRappers");
		rappersAndVotesSince(firstDayOfTheMonth).exec(function(err, rappers) {
			if (err) return console.error(err);
			console.timeEnd("db.getMonthRappers");
			rappersResponse = setScoreAndSort(rappers);

			dbCache.set("monthRappers", rappersResponse, function(err, success ){
				if (err) return console.error(err);
			});

			returnRapperListResponse(res, rappersResponse);	
		});
	}
}

function getAllRappersWeek(req, res){
	function getMonday() {
		var d = new Date();
		var day = d.getDay();
		var diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
		return new Date(d.setDate(diff));
	}

	var weekRappers;

	dbCache.get("weekRappers", function( err, value ){
  		if (err) return console.error(err);
    	weekRappers = value["weekRappers"];
	});

	if(weekRappers){
		returnRapperListResponse(res, weekRappers);
	} else{
		var monday = getMonday();

		console.time("db.getWeeksRappers");
		rappersAndVotesSince(monday).exec(function(err, rappers) {
			if (err) return console.error(err);
			console.timeEnd("db.getWeeksRappers");
			rappersResponse = setScoreAndSort(rappers);

			dbCache.set("weekRappers", rappersResponse, function(err, success ){
				if (err) return console.error(err);
			});

			returnRapperListResponse(res, rappersResponse);
		});
	}
}

function getTwoRandomRappers(req, res) {
	
	function getTwoRappersAndSendResponse(rappers) {
		var twoRandomRappers = utils.getTwoRandomElementsFrom(rappers);

		var cookie = req.header('Cookie');
		var obj = {left: twoRandomRappers[0], right: twoRandomRappers[1]};

		sessionVoteMap.set(cookie, obj, function( err, success ){
			if (err) return console.error(err);
		});

   		res.send(200, {left:twoRandomRappers[0], right:twoRandomRappers[1]});		
	}

	var allRappers;

	dbCache.get("allRappersForRandom", function( err, value ){
  		if (err) return console.error(err);
    	allRappers = value["allRappersForRandom"];
	});

	if(allRappers){
		getTwoRappersAndSendResponse(allRappers);
	} else {
		console.time("db.getAllRappersForRandom");
		models.Rapper.find().select('name picture').exec(function (err, rappers) {
			if (err) return console.error(err);
			console.timeEnd("db.getAllRappersForRandom");
			
			dbCache.set("allRappersForRandom", rappers, function(err, success ){
				if (err) return console.error(err);
			});

			getTwoRappersAndSendResponse(rappers);
		});
	}	
}

function registerVote(winningRapper, losingRapper) {
	console.time("db.updateWinner");
	models.Rapper.update({_id: winningRapper._id },
		{$push: { wins : {vs: losingRapper._id} }}, {upsert:true}, function(err, data) {
			if (err) return console.error(err);
			console.timeEnd("db.updateWinner");
		});

console.time("db.updateLoser");
	models.Rapper.update({_id: losingRapper._id },
		{$push: { losses : {vs: winningRapper._id} }}, {upsert:true}, function(err, data) {
			if (err) return console.error(err);
			console.timeEnd("db.updateLoser");
		});
}

function vote(req, res) {

	var voteElement = req.body;
	var cookie = req.header('Cookie')

	var rappersToVoteFor;

	sessionVoteMap.get(cookie, function( err, value ){
  		if (err) return console.error(err);
    	console.log(value[cookie]);
    	rappersToVoteFor = value[cookie];
	});

	console.log(rappersToVoteFor);

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

	console.time("db.findWinner");
	models.Rapper.findOne({_id: winner._id}).select('name -_id wins losses').exec(function (err, rapper) {
		if (err) return console.error(err);
		console.timeEnd("db.findWinner");
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
