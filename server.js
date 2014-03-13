var restify = require('restify');
var fs = require('fs');
var controller = require('./controller');

var server = restify.createServer();
server.use(restify.bodyParser({ mapParams: false }));

var form = "<!DOCTYPE HTML><html><body>" +
"<form method='post' action='/admin/createRapper' enctype='multipart/form-data'>" +
"<input type='text' name='rapperName'/>" +
"<input type='file' name='image'/>" +
"<input type='submit' /></form>" +
"</body></html>";

server.use(
  function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
);

server.get('/api/Rappers', controller.getAllRappers);
server.get('/api/Rappers/tworandom', controller.getTwoRandomRappers);
server.get('/api/Rappers/:id', controller.getRapper);
server.post('/api/Vote', controller.vote);

server.get('/admin/createRapper', function (req, res){
	res.writeHead(200, {'Content-Type': 'text/html' });
	res.end(form);
});

/// Post files
server.post('/admin/createRapper', function(req, res) {
  console.log(req)
  var imageData = fs.readFileSync(req.files.image.path)
  var imageName = req.files.image.name
  var rapperName = req.body.rapperName
  controller.createRapper(rapperName, imageName, imageData)

  res.send(200);
  return next();
});

server.get(/.*/, restify.serveStatic({
  directory: 'public',
  default: 'index.html'
}));

server.listen(8080, function() {
	console.log('%s listening at %s', server.name, server.url);
});
