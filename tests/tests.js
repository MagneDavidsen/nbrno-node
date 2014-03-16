var assert = require('assert')

describe('Array', function(){
	describe('#indexOf()', function(){
		it('should return -1 when the value is not present', function(){
			assert.equal(-1, [1,2,3].indexOf(5));
			assert.equal(-1, [1,2,3].indexOf(0));
		})
	})
})


var mongoose = require('mongoose');
var models = require('../models');
mongoose.connect('mongodb://localhost/unit_test');  

describe("Rappers", function(){  

	var rapper = new models.Rapper
	
	beforeEach(function(done){    
    //add some test data    
		
		rapper.name = "rapper-1"
		rapper.picture.fileName = "image-1"
		rapper.picture.data = null
		rapper.picture.contentType = "contenttype-1"
		rapper.save(function (err, rapper) {
				if (err){
					return console.error(err);	

				} 	
				done();	
	});

	});    
	
	afterEach(function(done){    
	    //delete all the customer records    
	    models.Rapper.remove({}, function() {      
	    	done();    
	    });  
	});  

	describe('Find', function(){
		it('should return rapper that is inserted', function(){
			var dbRapper = models.Rapper.find({name:'rapper-1'})
			assert.equal(rapper, dbRapper);

		})
	})


});