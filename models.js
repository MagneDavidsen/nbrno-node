var mongoose = require('mongoose')
var Schema = mongoose.Schema

var voteSchema = new Schema({
	ip: { type: String },
  	timestamp: {  type: Date, default: Date.now },
  	vs: { _rapperId: Schema.Types.ObjectId }
})

var rapperSchema = new Schema({
  name: { type: String },
  picture: { data: String, contentType: String, fileName: String },
  wins: [voteSchema],
  losses: [voteSchema]
})

var Rapper = mongoose.model('Rapper', rapperSchema)

module.exports = {
  Rapper: Rapper
};