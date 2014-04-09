var db = require('./db');
var models = require('./models');
var utils = require('./utils');
var util = require('util');
var parallel = require('when/parallel');
var when = require('when');
var NodeCache = require("node-cache");

var fiveMinutes = 60 * 5;

var dbCache = new NodeCache({ stdTTL: fiveMinutes, checkperiod: fiveMinutes });

function setScoreAndSort(rappers, minVotes) {
    var rappersResponse = rappers.map(function (rapper) {
        var winPercentage = (rapper.totalWins + rapper.totalLosses) > minVotes ? rapper.totalWins / (rapper.totalWins + rapper.totalLosses) : 0;
        return {name: rapper.name, score: winPercentage}
    });

    rappersResponse.sort(function (a, b) {
        return a.score - b.score
    }).reverse();

    var withoutscore = rappersResponse.map(function (rapper){
        return {name: rapper.name}
    });

    return withoutscore;
}

function returnRapperListResponse(res, rappers) {
    res.send(200, rappers.slice(0, 50));
}

function getAllRappers(req, res) {
    var allRappers;
    dbCache.get("allRappers", function (err, value) {
        if (err) return console.error(err);
        allRappers = value["allRappers"];
    });

    if (allRappers) {
        returnRapperListResponse(res, allRappers);
    } else {
        console.time("db.getAllRappers");
        models.Rapper.find().select('name totalWins totalLosses -_id').exec(function (err, rappers) {
            if (err) return console.error(err);
            console.timeEnd("db.getAllRappers");
            rappersResponse = setScoreAndSort(rappers, 100);

            dbCache.set("allRappers", rappersResponse, function (err, success) {
                if (err) return console.error(err);
            });

            returnRapperListResponse(res, rappersResponse);
        });
    }
}

function getAllRappersDay(req, res) {
    var today = new Date();
    today.setHours(0,0,0,0);

    var dayRappers;

    dbCache.get("dayRappers", function (err, value) {
        if (err) return console.error(err);
        dayRappers = value["dayRappers"];
    });

    if (dayRappers) {
        returnRapperListResponse(res, dayRappers);
    } else {
        function handleWinnersAndLosers(response) {
            console.timeEnd("db.getAllRappersForDay");

            var loserResult = response[0];
            var winnerResult = response[1];

            console.time("copyLosses");
            var rappers = utils.copyLossesFromArray(winnerResult, loserResult);
            console.timeEnd("copyLosses");

            var scoreRappers = setScoreAndSort(rappers,1 );

            dbCache.set("dayRappers", scoreRappers, function (err, success) {
                if (err) return console.error(err);
            });

            returnRapperListResponse(res, scoreRappers);
        }

        console.time("db.getAllRappersForDay");
        var winnerPromise = models.Vote.aggregate([
            {$match: {'timestamp': {$gte: today}}},
            {$group: {'_id': '$winner', 'name': {$first: '$winnerName'}, 'totalWins': {$sum: 1}}}
        ]).exec();

        var loserPromise = models.Vote.aggregate([
            {$match: {'timestamp': {$gte: today}}},
            {$group: {'_id': '$loser', 'name': {$first: '$loserName'}, 'totalLosses': {$sum: 1}}}
        ]).exec();

        var newpromise = when.all([loserPromise, winnerPromise]);

        newpromise.then(handleWinnersAndLosers);
    }
}

function getAllRappersWeek(req, res) {
    function getMonday() {
        var d = new Date();
        var day = d.getDay();
        var diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        var monday = new Date(d.setDate(diff));
        monday.setHours(0,0,0,0);
        return monday;
    }

    var weekRappers;

    dbCache.get("weekRappers", function (err, value) {
        if (err) return console.error(err);
        weekRappers = value["weekRappers"];
    });

    if (weekRappers) {
        returnRapperListResponse(res, weekRappers);
    } else {
        function handleWinnersAndLosers(response) {
            console.timeEnd("db.getAllRappersForWeek");

            var loserResult = response[0];
            var winnerResult = response[1];

            console.time("copyLosses");
            var rappers = utils.copyLossesFromArray(winnerResult, loserResult);
            console.timeEnd("copyLosses");

            var scoreRappers = setScoreAndSort(rappers, 1);

            dbCache.set("weekRappers", scoreRappers, function (err, success) {
                if (err) return console.error(err);
            });

            returnRapperListResponse(res, scoreRappers);
        }

        console.time("db.getAllRappersForWeek");
        var winnerPromise = models.Vote.aggregate([
            {$match: {'timestamp': {$gte: getMonday()}}},
            {$group: {'_id': '$winner', 'name': {$first: '$winnerName'}, 'totalWins': {$sum: 1}}}
        ]).exec();

        var loserPromise = models.Vote.aggregate([
            {$match: {'timestamp': {$gte: getMonday()}}},
            {$group: {'_id': '$loser', 'name': {$first: '$loserName'}, 'totalLosses': {$sum: 1}}}
        ]).exec();

        var newpromise = when.all([loserPromise, winnerPromise]);

        newpromise.then(handleWinnersAndLosers);
    }
}

function getTwoRandomRappers(req, res) {

    function getTwoRappersAndSendResponse(rappers) {
        var rappersObject = utils.getTwoRandomElementsFrom(rappers);

        var twoRandomRappers = {left: rappersObject[0], right: rappersObject[1]}

        req.session.leftRapper = twoRandomRappers.left;
        req.session.rightRapper = twoRandomRappers.right;

        util.debug("getTwoRandomRappers: " + twoRandomRappers.left.name + " & " + twoRandomRappers.right.name);

        res.setHeader('Cache-Control', 'no-cache');

        res.send(200, twoRandomRappers);
    }

    var allRappers;

    dbCache.get("allRappersForRandom", function (err, value) {
        if (err) return console.error(err);
        allRappers = value["allRappersForRandom"];
    });

    if (allRappers) {
        getTwoRappersAndSendResponse(allRappers);
    } else {
        console.time("db.getAllRappersForRandom");
        models.Rapper.find().select('name picture.fileName').exec(function (err, rappers) {
            if (err) return console.error(err);
            console.timeEnd("db.getAllRappersForRandom");

            dbCache.set("allRappersForRandom", rappers, function (err, success) {
                if (err) return console.error(err);
            });

            getTwoRappersAndSendResponse(rappers);
        });
    }
}

function registerVote(winningRapper, losingRapper, ipAddress) {

    util.debug("vote - winner: " +winningRapper.name + ", loser: " +losingRapper.name);

    var today = new Date();
    today.setHours(0,0,0,0);

    var vote = new models.Vote;
    vote.ip = ipAddress;
    vote.winner = winningRapper._id;
    vote.winnerName  = winningRapper.name;
    vote.loser = losingRapper._id;
    vote.loserName  = losingRapper.name;

    console.time("db.saveVote");
    vote.save(function (err, vote) {
        if (err) return console.error(err)
        console.timeEnd("db.saveVote");;
    });

    console.time("db.updateWinnerCounter");
    models.Rapper.update({_id: winningRapper._id }, { $inc: {totalWins: 1 }}, function(err, data){
        if (err) return console.error(err);
        console.timeEnd("db.updateWinnerCounter");
    });

    console.time("db.updateLoserCounter");
    models.Rapper.update({_id: losingRapper._id }, { $inc: {totalLosses: 1 }}, function(err, data){
        if (err) return console.error(err);
        console.timeEnd("db.updateLoserCounter");
    });
}

function vote(req, res) {

    var voteElement = req.body;
    var leftRapper = req.session.leftRapper;
    var rightRapper = req.session.rightRapper;

    if(!leftRapper) {
        util.error("ERROR: No rappers in session");
        res.send(200, {});
    } else {
        var winner;
        var loser;

        switch (voteElement.side) {
            case "left":
                winner = leftRapper;
                loser = rightRapper;
                break;
            case "right":
                winner = rightRapper;
                loser = leftRapper;
                break;
            default:
                console.error("ERROR: Side is neither left or right: " + voteElement.side)
        }
        registerVote(winner, loser, req.ip);

        res.send(200, {});
    }
}

module.exports = {
    getAllRappers: getAllRappers,
    getAllRappersWeek: getAllRappersWeek,
    getAllRappersDay: getAllRappersDay,
    getTwoRandomRappers: getTwoRandomRappers,
    vote: vote
};
