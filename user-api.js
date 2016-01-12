"use strict";

/**
 * File implements the express routes for the user handling via a http RESTful API
 *
 * @module user-api
 */

var config;
function setConfig(cfg){
    if(!cfg && typeof cfg !== Object){
        throw new Error("Config object not defined");
    }
    config = cfg;
}
function getConfig(){
    return config;
}

var db;
function setDatabase(database){
    if(!database){
        throw new Error("Database object not defined");
    }
    db = database;
}
function getDatabase(){
    return db;
}


/*
 * TODO:
 * Callback 
 *
 */


// Is this call to a validation function successful?
function resultIsValid(o){
    return o.valid;
}


function isUsernameValid(username, cb){
    if(username && username !== ""){
        // More validation here
        if(!(/^[a-z0-9]+$/i.test(username))){
            cb({
                valid : false,
                message : "alphanumeric characters only"
            });
            return;
        }

        // Already in use
        db.checkUsernameExists(function(exists){
            var o = {
                valid : !exists
            };
            if(exists){
                o.message = "Username already exists";
            }
            cb(o);
        }, null, username);
    }else{
        cb({
            valid : false,
            message : "Username was not sent or is empty"
        });
    }
}

function isDobValid(dob, cb){
    // Must be at least x years old?
    if(!dob || isNaN(dob.getTime())){
        cb({
            valid : false,
            message : "invalid date"
        });
        return;
    }
    if(dob >= new Date(Date.now() - (1000 * 60 * 60 * 24 * 365 * 10))){
        cb({
            valid : false,
            message : "You must be at least 10 years old"
        });
        return;
    }

    cb({
        valid : true
    });
}

function isPasswordValid(pw, cb){
    cb({
        valid : (pw && pw.length >= 6)
    });
}




/**
 * The user api express route functions
 * @namespace routes
 *
 */
var routes = {
    /** 
     *  aa
     * @param a
     */
    get_conditions_list : function (req, res){
        res.json(config.conditions.listAll());
    },


    validate_username : function(req, res){
        var username = req.body.username && req.body.username.trim();
        isUsernameValid(username, function(o){
            res.json(o);
        });
    },



    validate_dob : function(req, res){
        var dob = req.body.dob && new Date(req.body.dob);
        isDobValid(dob, function(o){
            res.json(o);
        });
    },






    sign_up : function(req, res){
        var b = req.body,
            username = b.username && b.username.trim(),
            password = b.password,
            dob = b.dob && new Date(b.dob);


        var validations = [];

        isUsernameValid(username, function(o){
            validations.push(o);
            isPasswordValid(password, function(o){
                validations.push(o);
                isDobValid(dob, function(o){
                    validations.push(o);

                    var valid = validations.every(resultIsValid);
                    if(valid){
                        db.createUser(
                            // Pass
                            function(id){
								db.readUserByName(function(results){
									var dbres = setUpDefaultItems(results.id);
									console.log(dbres);
									if(dbres[0]){
										res.json({
											error : false    
										});
									}else{
										res.status(400).json({
											error : dbres[1]
										});
									}
								}, function(error){
									res.status(400).json({
										error : error
									});
								}, username);
                            },
                            // Fail
                            function(error){
                                res.status(400).json({
                                    error : error
                                });
                            },
                            { username : username, password : password, dob : dob }
                        );
                    }else{
                        res.status(400).json({
                            error : "some stuff not valid",
                            validations : validations
                        });
                    }


                });
            });
        });

    }

};

function setUpDefaultItems(userid){
	var okay = true, error;
	var default_items = [200, 201, 300, 301, 400, 401, 500, 501];
	for(var i=0; i<default_items.length; i++){
		var iid = default_items[i];
		db.createUserInventory(function(){}, function(err){error = err;}, {"user_id": userid, "item_id": iid.toString(), "active": true});
	}
	return [okay, error];
}






/**
 *
 * Returns things
 * @param {module:config} cfg - A config object
 * @param {Object} db - A database object

 * @return {module:user-api~routes} The user-api routes
 */
module.exports = function (cfg, db){
    setConfig(cfg);
    setDatabase(db);
    
    return routes;    
};
