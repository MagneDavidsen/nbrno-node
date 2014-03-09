var restify = require('restify');
var controller = require('./controller');

var server = restify.createServer();
server.use(restify.bodyParser({ mapParams: false }));

server.use(
  function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
);

server.get('/api/Rappers', controller.getAllRappers);
server.post('/api/Rappers', controller.createRapper);
server.get('/api/Rappers/tworandom', controller.getTwoRandomRappers);
server.get('/api/Rappers/:id', controller.getRapper);
server.post('/api/Vote', controller.vote);

server.get(/.*/, restify.serveStatic({
  directory: 'public',
  default: 'index.html'
}));

server.listen(8080, function() {
	console.log('%s listening at %s', server.name, server.url);
});
