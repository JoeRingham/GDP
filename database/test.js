'use strict';

/*
 * test.js
 * 
 * Interface for all database interaction
 * Maps all functions in different modules into this one interface
 *
 * @authors Joe Ringham
*/

var config = require('../config.js')
	, db = require('./database.js').init(tpass, tfail, config.database.getSettings("test"));
	;

function tpass(results){
	console.log("PASS");
	console.log(results);
	console.log("*************************");
}

function tfail(err){
	console.log("FAIL");
	console.log(err);
	console.log("*************************");
}


var ts = new Date().toISOString();

var dummyUser = {
	username : 'user1'
	, password : 'pass1'
	, dob : ts
}

var dummyUser2 = {
	username : 'user2'
	, password : 'pass2'
	, dob : ts
}

//db.createUser(tpass, tfail, dummyUser);

//db.createUser(tpass, tfail, dummyUser2);

db.getInventoryForUser(tpass, tfail, 2);

//db.readUserById(tpass, tfail, 1);

//db.readUserByName(tpass, tfail, "usernon");

//db.authenticateUser(tpass, tfail, 'usernon', 'wrong');

//db.updateUserDetails(tpass, tfail, dummyUser2, 1);

//db.updateUserCurrency(tpass, tfail, 10, 1);

//db.deleteUser(tpass, tfail, 1);

//db.createSession(tpass, tfail, {user_id: null, start_time: ts});

//db.readSessionById(tpass, tfail, 0);

//db.endSession(tpass, tfail, ts, 0);

//db.deleteSession(tpass, tfail, 1);

var ts = new Date()
	, ts1 = new Date()
	, ts2 = new Date();

ts1.setHours(ts1.getHours() - 2);
ts2.setHours(ts2.getHours() - 2);

var dummyPlay = {
	user_id : 3
	, game_id : 'game2' 
	, start_time : ts2
	, end_time : ts
	, score : 50
}

//db.createPlay(tpass, tfail, dummyPlay);


var tsA = new Date()
	, tsB = new Date()
	, tsC = new Date();


tsB.setHours(tsB.getHours() - 3);
tsC.setHours(tsC.getHours() - 1);

var filters = {
	//user_id : 3
	//game_id : "game2"
	time_range : {
		start : ts
	//	, end : null
	}
}

//db.getScores(tpass, tfail, filters, {column: 'score', direction: 'DESC'}, null);

//require('./creation_things/buildDB.js')(tpass, tfail, 'test');
