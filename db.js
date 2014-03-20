var mongoose = require('mongoose')

var connect = function () {
  var db_uri = process.env.MONGOLAB_URI || 'mongodb://localhost/test';
  var options = { server: { socketOptions: { keepAlive: 1 } } }
  mongoose.connect(db_uri, options)
}
connect()

// Error handler
mongoose.connection.on('error', function (err) {
  console.log(err)
})

// Reconnect when closed
mongoose.connection.on('disconnected', function () {
  connect()
})
