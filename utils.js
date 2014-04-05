var util = require('util');

function getTwoRandomElementsFrom(list) {
    var firstRandomIndex = Math.floor(Math.random() * list.length);
    var secondRandomIndex = firstRandomIndex;

    while (firstRandomIndex === secondRandomIndex) {
        secondRandomIndex = Math.floor(Math.random() * list.length);
    }

    return [list[firstRandomIndex], list[secondRandomIndex]];
}

function copyLossesFromArray(winArray, loseArray) {

    util.debug("WinArray: " + JSON.stringify(winArray) + ", loseArray: " + JSON.stringify(loseArray));

    loseArray.forEach(function (loseElement) {
        var winElement;
        winArray.forEach(function (element) {
            if (element._id.equals(loseElement._id)) {
                winElement = element;
            }
        });

        if (winElement) {
            winElement.totalLosses = loseElement.totalLosses;
        } else {
            winArray.push(loseElement);
        }
    })

    util.debug("merged array: " + JSON.stringify(winArray));

    return winArray;
}

module.exports = {
    getTwoRandomElementsFrom: getTwoRandomElementsFrom,
    copyLossesFromArray: copyLossesFromArray
};
