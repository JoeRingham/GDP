'use strict';

/*
 * userCurrencyDb_db.js
 * 
 * Queries for the Plays database table
 *
 * @authors Joe Ringham
*/

var currencyDb = {}
	, UserCurrency = undefined
	;

currencyDb.createCurrency = function(currency, userid) {	
	console.log(currency, userid);
	return UserCurrency.destroy({
		where : {
			'user_id' : userid,
		}
	}).then(function(){
		console.log('aaa');
		return UserCurrency.create({
			'currency' : currency,
			'user_id' : userid
		});
	});
}

//Updates only currency for a user entry
// sets absolute
currencyDb.updateUserCurrency = function(newCurrency, userid){	
	return currencyDb.createCurrency(newCurrency, userid)
}

// sets relative currency
currencyDb.modifyUserCurrency = function(modifyValue, userid){
	return currencyDb.readUserCurrency(userid).then(function(usercurr){
		var newCurr;
		
		if(usercurr) newCurr = usercurr.currency + modifyValue;
		else newCurr = modifyValue;
		
		console.log(newCurr);
		return currencyDb.createCurrency(newCurr, userid);
	});
}

currencyDb.readUserCurrency = function(userid){
	return UserCurrency.findOne({
		where : {
			'user_id' : userid
		}
	});
}

//Deletes the entry that matches the id
currencyDb.deleteCurrency = function(id){
	return UserCurrency.destroy({ where : { 'id' : id } });
}

module.exports = function(seq){
	UserCurrency = seq.UserCurrency;
	
	return currencyDb;
}