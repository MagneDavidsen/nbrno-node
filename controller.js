var db = require('./db');
var models = require('./models');
var utils = require('./utils');
var util = require('util');
var NodeCache = require("node-cache");

var fiveMinutes = 60 * 10;

var dbCache = new NodeCache({ stdTTL: fiveMinutes, checkperiod: fiveMinutes });

function rappersAndVotesSince(date) {
    return models.Rapper.aggregate([
        {$unwind: '$wins'},
        {$match: {'wins.timestamp': {$gte: date}}},
        {$group: {'_id': '$_id', 'name': {$first: '$name'}, 'losses': {$first: '$losses'}, 'wins': {$sum: 1}}},
        {$unwind: '$losses'},
        {$match: {'losses.timestamp': {$gte: date}}},
        {$group: {'_id': '$_id', 'name': {$first: '$name'}, 'losses': {$sum: 1}, 'wins': {$first: '$wins'}}}
    ]);
}

function setScoreAndSort(rappers) {
    var rappersResponse = rappers.map(function (rapper) {
        return {name: rapper.name, score: rapper.wins - rapper.losses}
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
        models.Rapper.aggregate([
            {$unwind: '$wins'},
            {$group: {'_id': '$_id', 'name': {$first: '$name'}, 'losses': {$first: '$losses'}, 'wins': {$sum: 1}}},
            {$unwind: '$losses'},
            {$group: {'_id': '$_id', 'name': {$first: '$name'}, 'losses': {$sum: 1}, 'wins': {$first: '$wins'}}}
        ]).exec(function (err, rappers) {
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

        console.time("db.getMonthRappers");
        rappersAndVotesSince(firstDayOfTheMonth).exec(function (err, rappers) {
            if (err) return console.error(err);
            console.timeEnd("db.getMonthRappers");
            rappersResponse = setScoreAndSort(rappers);

            dbCache.set("monthRappers", rappersResponse, function (err, success) {
                if (err) return console.error(err);
            });

            returnRapperListResponse(res, rappersResponse);
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
        var monday = getMonday();

        console.time("db.getWeeksRappers");
        rappersAndVotesSince(monday).exec(function (err, rappers) {
            if (err) return console.error(err);
            console.timeEnd("db.getWeeksRappers");
            rappersResponse = setScoreAndSort(rappers);

            dbCache.set("weekRappers", rappersResponse, function (err, success) {
                if (err) return console.error(err);
            });

            returnRapperListResponse(res, rappersResponse);
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
        models.Rapper.find().select('name picture').exec(function (err, rappers) {
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
    console.time("db.updateWinner");
    util.debug("vote - winnerId: " +winningRapperId + ", loserId: " +losingRapperId);
    models.Rapper.update({_id: winningRapperId },
        {$push: { wins: {vs: losingRapperId, ip: ipAddress} }}, {upsert: true}, function (err, data) {
            if (err) return console.error(err);
            console.timeEnd("db.updateWinner");
        });

    console.time("db.updateLoser");
    models.Rapper.update({_id: losingRapperId },
        {$push: { losses: {vs: winningRapperId, ip: ipAddress} }}, {upsert: true}, function (err, data) {
            if (err) return console.error(err);
            console.timeEnd("db.updateLoser");
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
    getAllRappersWeek: getAllRappersWeek,
    getAllRappersMonth: getAllRappersMonth,
    getTwoRandomRappers: getTwoRandomRappers,
    vote: vote
};
