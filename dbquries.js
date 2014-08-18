
//matches won most often
db.votes.aggregate([
    {$group: {'_id': {'winner':'$winnerName', 'loser':'$loserName'}, 'totalMatches': {$sum: 1}}},
    {$sort: {totalMatches:-1}}, {$limit:10}])



//finding highest winRatios
var result = db.votes.aggregate([
    {$group: {'_id': {'winner':'$winnerName', 'loser':'$loserName'}, 'totalMatches': {$sum: 1}}},
    {$sort: {totalMatches:-1}}])

var ratios = [];

result.result.forEach(function(element){
    var winner = element._id.winner;
    var loser = element._id.loser;
    var wins = element.totalMatches;

    var inverse = result.result.filter(function(inverse){
        if(inverse._id.winner == loser && inverse._id.loser == winner){
            return inverse;
        }});

    var inverseResult = inverse[0];

    if(inverseResult) {
        var winratio = wins / (inverseResult.totalMatches + wins);
        ratios.push({winner:winner, loser:loser, winratio: winratio});
    }
});

function compareRatios(a,b) {
    if (a.winratio < b.winratio)
        return -1;
    if (a.winratio > b.winratio)
        return 1;
    return 0;
};

var sortedRatios = ratios.sort(compareRatios)



//beaten OnklP most times
db.votes.aggregate([{$match:{loserName:"OnklP"}},{$group:{'_id':'$winnerName', 'sum':{$sum:1 }}}, {$sort:{sum:1}} ])