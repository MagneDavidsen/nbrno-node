var mongoose = require('mongoose')
var Schema = mongoose.Schema

var voteSchema = new Schema({
	ip: { type: String },
  	timestamp: {  type: Date, default: Date.now },
  	vs: { _rapperId: Schema.Types.ObjectId }
});

var newVoteSchema = new Schema({
    ip: { type: String },
    timestamp: {  type: Date, default: Date.now },
    winner: { type: Schema.Types.ObjectId },
    loser: { type: Schema.Types.ObjectId }
})

var rapperSchema = new Schema({
  name: { type: String },
  picture: { data: String, contentType: String, fileName: String },
  wins: [voteSchema],
  losses: [voteSchema],
  totalWins: {type: Number, default: 0},
  totalLosses: {type: Number, default: 0}
})

var Rapper = mongoose.model('Rapper', rapperSchema)
var Vote = mongoose.model('Vote', newVoteSchema)

module.exports = {
  Rapper: Rapper,
  Vote: Vote
};