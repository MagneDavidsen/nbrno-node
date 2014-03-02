var restify = require('restify');

var server = restify.createServer();

function send(req, res, next) {
	res.send('hello ' + req.params.name);
	return next();
}

server.get('/hello/:name', send);

server.listen(8080, function() {
	console.log('%s listening at %s', server.name, server.url);
});
