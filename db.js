var mongoose = require('mongoose')
  , Schema = mongoose.Schema

var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } }
  mongoose.connect('mongodb://localhost/test', options)
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

var voteSchema = new Schema({
	ip: { type: String },
  	timestamp: {  type: Date, default: Date.now },
  	win: { type: Boolean }
})

var rapperSchema = new Schema({
  name: { type: String },
  picture: { data: String, contentType: String, fileName: String },
  votes: [voteSchema]
})

var Rapper = mongoose.model('Rapper', rapperSchema)

module.exports = {
  Rapper: Rapper
};
