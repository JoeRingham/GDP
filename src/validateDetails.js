'use strict';

/*
 * validateDetails.js
 * 
 * Used to validate common things throughout app
 * Just add new properties to constraints objects to add more things to validate!
 * See http://validatejs.org/
 *
 * @authors Joe Ringham
*/

var validate = require("validate.js")
	;
validate.Promise = require('bluebird');

//Date time validation functions
validate.extend(validate.validators.datetime, {
	parse: function(value, options) {
		return new Date(value);
	},
	format: function(value, options) {
		return value.toISOString();
	}
});

//Constraints: see http://validatejs.org/
var constraints = {
	username : {
		format : {
			pattern : "^[a-z0-9]+$"
			, flags : "i"
			, message : "can only contain a-z and 0-9"
		}
		, length : {
			minimum: 1
			, maximum : 25
		}
	}
	, password : {
		length : {
			minimum : 6 
		}
	}
	, dob : {
		datetime : {
			get latest () {
			    return new Date(Date.now() - (1000 * 60 * 60 * 24 * 365 * 10));
			}
		}
	}
	, currency : {
		numericality : {
			onlyInteger: true
			, greaterThanOrEqualTo: 0
		}
	}
	, start_time : {
		datetime : {
			get latest () { return new Date() }
		}
	}
	, end_time : {
		datetime : {
			earliest : "start_time"
			, get latest () { return new Date() }
		} 
	}
	, score : {
		numericality : {
			onlyInteger: true
		}
	}
}

module.exports = function(pass, fail, obj){
	//If end_time exists, validate against start_time to make sure it is later!
	if(obj.end_time){
		//Error if start_time doesn't exist to compare against
		if(!obj.start_time) {
			return handleFail({
					end_time : "A start_time property must be provided, so that end_time can be compared against it."
				});
		} 

		//Error if start_time is not before end_time
		if(obj.end_time < obj.start_time) {
			return handleFail({
					end_time : [
						"end_time("+obj.end_time.toISOString()+")"
						, "must not be earlier than given"
						, "start_time("+obj.start_time.toISOString()+")"
					].join(" ")
				});
		}
	}

	//Asynchronously call the validation
	validate.async(obj, constraints).then(pass, handleFail);

	function handleFail(error){
		if (error instanceof Error)
			return fail(err);
  		
		fail({
			name : "ERR_VALIDATION_FAILED"
			// Message lists all the properties the validation failed for
			, message : "Validation has failed for properties: "+Object.keys(error).join(', ')
			, detail : error
		});
	}
};
