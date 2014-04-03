var db = require('./db');
var models = require('./models');
var utils = require('./utils');
var util = require('util');
var NodeCache = require("node-cache");

var fiveMinutes = 60 * 10;

var dbCache = new NodeCache({ stdTTL: fiveMinutes, checkperiod: fiveMinutes });

function filterRappersOnFromDate(rappers, fromDate){
    function isVoteInRange(vote){
        return vote.timestamp > fromDate;
    }

    var newRappers = rappers.map(function(rapper){
        var newRapper = rapper;
        newRapper.wins = rapper.wins.filter(isVoteInRange);
        newRapper.losses = rapper.losses.filter(isVoteInRange);
        return newRapper;
    })

    return newRappers;
}

function setScoreAndSort(rappers) {
    var rappersResponse = rappers.map(function (rapper) {
        return {name: rapper.name, score: rapper.totalWins - rapper.totalLosses}
    });

    rappersResponse.sort(function (a, b) {
        return a.score - b.score
    }).reverse().map(function (rapper){
        return {name: rapper.name}
    });
    return rappersResponse;
}

function returnRapperListResponse(res, rappers) {
    res.send(200, rappers.slice(0, 10));
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
            rappersResponse = setScoreAndSort(rappers);

            dbCache.set("allRappers", rappersResponse, function (err, success) {
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

    dbCache.get("monthRappers", function (err, value) {
        if (err) return console.error(err);
        monthRappers = value["monthRappers"];
    });

    if (monthRappers) {
        returnRapperListResponse(res, monthRappers);
    } else {

        console.time("db.getAllRappersForMonth");
        models.Rapper.find().select('name wins losses').exec(function (err, rappers) {
            if (err) return console.error(err);
            console.timeEnd("db.getAllRappersForMonth");
            var monthResponse = filterRappersOnFromDate(rappers, firstDayOfTheMonth);

            dbCache.set("monthRappers", monthResponse, function (err, success) {
                if (err) return console.error(err);
            });

            returnRapperListResponse(res, monthResponse)
        });
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

        console.time("db.getAllRappersForWeek");
        models.Rapper.find().select('name wins losses').exec(function (err, rappers) {
            if (err) return console.error(err);
            console.timeEnd("db.getAllRappersForWeek");
            var weekResponse = filterRappersOnFromDate(rappers, getMonday());

            dbCache.set("weekRappers", weekResponse, function (err, success) {
                if (err) return console.error(err);
            });

            returnRapperListResponse(res, weekResponse)
        });
    }
}

function getTwoRandomRappers(req, res) {

    function getTwoRappersAndSendResponse(rappers) {
        var rappersObject = utils.getTwoRandomElementsFrom(rappers);

        var twoRandomRappers = {left: rappersObject[0], right: rappersObject[1]}

        req.session.leftRapperId = twoRandomRappers.left._id;
        req.session.rightRapperId = twoRandomRappers.right._id;

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

function registerVote(winningRapperId, losingRapperId, ipAddress) {

    util.debug("vote - winnerId: " +winningRapperId + ", loserId: " +losingRapperId);

    var today = new Date();
    today.setHours(0,0,0,0);

    var vote = new models.Vote;
    vote.ip = ipAddress;
    vote.winner = winningRapperId;
    vote.loser = losingRapperId;

    console.time("db.saveVote");
    vote.save(function (err, vote) {
        if (err) return console.error(err)
        console.timeEnd("db.saveVote");;
    });

    console.time("db.updateWinnerCounter");
    models.Rapper.update({_id: winningRapperId }, { $inc: {totalWins: 1 }}, function(err, data){
        if (err) return console.error(err);
        console.timeEnd("db.updateWinnerCounter");
    });

    console.time("db.updateLoserCounter");
    models.Rapper.update({_id: losingRapperId }, { $inc: {totalLosses: 1 }}, function(err, data){
        if (err) return console.error(err);
        console.timeEnd("db.updateLoserCounter");
    });
}

function vote(req, res) {

    var voteElement = req.body;
    var leftRapperId = req.session.leftRapperId;
    var rightRapperId = req.session.rightRapperId;

    if(!leftRapperId) {
        util.error("ERROR: No rappers in session");
        res.send(200, {});
    } else {
        var winnerId;
        var loserId;

        switch (voteElement.side) {
            case "left":
                winnerId = leftRapperId;
                loserId = rightRapperId;
                break;
            case "right":
                winnerId = rightRapperId;
                loserId = leftRapperId;
                break;
            default:
                console.error("ERROR: Side is neither left or right: " + voteElement.side)
        }
        registerVote(winnerId, loserId, req.ip);

        res.send(200, {});
    }
}

module.exports = {
    getAllRappers: getAllRappers,
    getAllRappersWeek: getAllRappers,
    getAllRappersMonth: getAllRappers,
    getTwoRandomRappers: getTwoRandomRappers,
    vote: vote
};
