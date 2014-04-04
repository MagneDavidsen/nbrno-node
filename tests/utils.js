var assert = require('assert')
var utils = require('../utils')

describe('Utils', function(){
    describe('mergeTwo', function(){
        it('should merge one in each array', function(){

            var merged = utils.copyLossesFromArray(
                [{ _id: '53237c87e1b8b4271138b06a', name: 'Chirag', totalWins: 1 }],
                [{ _id: '53286ce4876994b07357943f', name: 'MC Optik', totalLosses: 1}]);

            var answer = [{ _id: '53237c87e1b8b4271138b06a', name: 'Chirag', totalWins: 1 }, { _id: '53286ce4876994b07357943f', name: 'MC Optik', totalLosses: 1 } ];

            assert.deepEqual(answer, merged);
        })

        it('should merge two with same id', function(){

            var merged = utils.copyLossesFromArray(
                [{ _id: '53237c87e1b8b4271138b06a', name: 'Chirag', totalWins: 1 }],
                [{ _id: '53237c87e1b8b4271138b06a', name: 'Chirag', totalLosses: 1}]);

            var answer = [{ _id: '53237c87e1b8b4271138b06a', name: 'Chirag', totalWins: 1, totalLosses: 1 } ];

            assert.deepEqual(answer, merged);
        })
    })
})
