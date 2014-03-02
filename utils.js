function getTwoRandomElementsFrom(list){
	var firstRandomIndex = Math.floor(Math.random()*list.length);
	var secondRandomIndex = firstRandomIndex;

	while(firstRandomIndex === secondRandomIndex) {
		secondRandomIndex = Math.floor(Math.random()*list.length);
	}

	return [list[firstRandomIndex],list[secondRandomIndex]];
}

module.exports = {
  getTwoRandomElementsFrom: getTwoRandomElementsFrom
};
