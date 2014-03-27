require('newrelic');

var fs = require('fs');
var controller = require('./controller');


var express = require('express');
var path = require('path');

var app = express();

var port = process.env.PORT || 8080;
var env = process.env.NODE_ENV;

var dist = env === 'production' ? 'dist' : 'client/src';

app.configure(function(){
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.static(path.join(__dirname, dist)));
});

var form = "<!DOCTYPE HTML><html><body>" +
"<form method='post' action='/admin/createRapper' enctype='multipart/form-data'>" +
"<input type='text' name='rapperName'/>" +
"<input type='file' name='image'/>" +
"<input type='submit' /></form>" +
"</body></html>";

app.get('/api/Rappers', controller.getAllRappers);
app.get('/api/Rappers/week', controller.getAllRappersWeek);
app.get('/api/Rappers/month',  controller.getAllRappersMonth);
app.get('/api/Rappers/tworandom', controller.getTwoRandomRappers);
app.post('/api/Vote', controller.vote);

var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});
