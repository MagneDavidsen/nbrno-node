var db = require('./db');
var models = require('./models');
var utils = require('./utils');
var util = require('util');


function generateRapperTable(rappers) {
    var html = "<!DOCTYPE HTML><html><body><table>";
    for(var i = 0; i < rappers.length; i++) {
        html+= "<tr><td>" +rappers[i].name+ "</td>";
        html+= "<td><img height=\"50\" src=\"pictures/" +rappers[i].picture.fileName+ "\" /></td></tr>";
    }
    return html + "</table></body></html>";
}

function getRappers(req, res) {

    models.Rapper.find().sort('name').select('name picture.fileName').exec(function (err, rappers) {
        if (err) return console.error(err);

        var rapperTable = generateRapperTable(rappers);

        res.writeHead(200, {'Content-Type': 'text/html' });
        res.end(rapperTable);
    });
}

module.exports = {
    getRappers: getRappers
};
