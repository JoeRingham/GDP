"use strict";

/**
 * Module that stores the configuration for all aspects of the system
 * Deals with system properties (port, pg database info, etc)
 * Scans the filesystem for new games and returns the file paths and assets when a game is requested
 *
 * @module superuser-api
 */

var fs = require("fs");
var validate = require("validate.js");
var path = require("path");

var config;
function setConfig(cfg){
    if(!cfg && typeof cfg !== Object){
        throw new Error("Config object not defined");
    }
    config = cfg;
}

var db;
function setDatabase(database){
    if(!database){
        throw new Error("Database object not defined");
    }
    db = database;
}

/**
 * Checks if a given object has specified properties defined
 *
 * @param {array} arrNames - the property names to check exist
 * @param {Object} objToTest - the object to test if has the property names defined
 * @return {string} a comma separated string of all the undefined properties
 */
function checkIsValid(arrNames, objToTest){
	var invalid = [];
	
	for(var i=0; i<arrNames.length; i++){
		if(objToTest[arrNames[i]] === undefined) invalid.push(arrNames[i]);
	}
	
	return invalid.join(", ");
}

/**
 * Returns an error message to the client
 *
 * @param {Object} res - the res object from the express_route
 * @param {string} message - the error message to send back to the client
 */
function sendError(res, message){
	res.json({'error' : message});
}

/**
 * Gets an used ID number for a given config type
 *
 * @param {Object} configObj - the relevant config.js sub-object (e.g. config.carriables)
 * @return {integer} the unused integer to use as the id for the new config
 */
function getRandomUnusedId(configObj){
	var newId;
	
	while(!newId){
		var currentId = Math.floor(Math.random() * 32767);
		
		if(!configObj.getConfig(currentId)){
			newId = currentId;
		}
		
	}
	return newId;
}

/**
 * Writes config file and sprite file to relevant location
 *
 * @param {string} 	spriteLoc 	- the location to write the sprite file to
 * @param {string} 	newLoc 		- the location to write the config.json file to
 * @param {Object} 	configObj 	- the object to turn into json and write to config.json
 * @param {array} 	otherFiles 	- the paths of other files to move on the filesystem
 */
function createFiles(spriteLoc, newLoc, configObj, otherFiles){
	newLoc = config.app.getRootDirectory() + "configs/" + newLoc + "/";
	
	fs.mkdir(newLoc, function(err){
		if(spriteLoc){
			fs.readFile(spriteLoc, function (err, data) {
				var newPath = newLoc + "sprite.png";
				fs.writeFile(newPath, data, err => {});
				
				fs.unlink(spriteLoc, err => {});
			});
		}
		
		fs.writeFile(newLoc + "config.json", JSON.stringify(configObj), err => {});
		
		if(otherFiles){
			
		}
	});
}

/**
 * Checks if a given input is valid JSON
 *
 * @param {string} str - The input to check is a JSON string
 * @return {boolean} Whether the input parameter is valid JSON
 */
function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Removes specified files and folders from the filesystem
 *
 * @param {string} path - The folder path to delete
 */
function deleteFolderRecursive(pat) {
	if(fs.existsSync(pat)){
		fs.readdirSync(pat).forEach(function(file, index){
			var curPath = path.join(pat, file);
			if(fs.lstatSync(curPath).isDirectory()){
				deleteFolderRecursive(curPath);
			}else{
				fs.unlinkSync(curPath);
			}
		});
		//fs.rmdirSync(path);
	}
}

/**
 * Create a route function and handles sending error messages if the correct
 * form components are missing
 *
 * @param {array} properties - An array of property names to check are present
 * @param {function} cb - The callback
 * @return {function} The express_route function that is used
 */
function createRoute(properties, cb){
	return function(req, res){
		var invalid = checkIsValid(properties, req.body);
		if(!invalid){
			cb(req, res);
		}else{
			sendError(res, {err : ['The following sections cannot be blank: ']});
		}
	};
} 

/****** Route functions ******/
/**
 * Contains functions that server as endpoints for form submissions
 *
 * @namespace routes
 */
var routes = {
	
	/**
     * Add a carriable configuration for use in game
     * 
	 * @var
     * @type {express_route}
     */
	add_bag_item : createRoute(["name", "effects"], function(req, res){
		//the validate.js constraints of all the properties
		var constraints = {
			name : {
				presence : true,
				format : /^[a-zA-Z\s]+$/
			}, effects : {
				presence: true
			}
		};
		//the validate.js constraints of the effects array
		var constraintsEffect = {
			id : {
				presence : true
			}, amount : {
				presence : true,
				numericality : {
					onlyInteger : true
				}
			}
		};
			
		//setup variables for use
		var properties = ["name", "effects"];
		if(isJsonString(req.body.effects)) req.body.effects = JSON.parse(req.body.effects);
		var effects = req.body.effects;
		
		//perform validation
		var allValid = validate(req.body, constraints);
		var effectsValid = validate.isArray(effects) && effects.every(ele => !validate(ele, constraintsEffect));
		
		if(allValid || !effectsValid){
			sendError(res, allValid || {effects : ['All effects must be numerical']});
			return;
		}
		
		//copy relevant properties over to config object and write it to file
		var obj = {}, i;
		for(i=0; i<properties.length; i++){
			obj[properties[i]] = req.body[properties[i]];
		}
		obj.id = getRandomUnusedId(config.carriables);	
		createFiles(req.file.path, path.join("carriables", obj.id.toString()), obj, undefined);

		res.json({"success": true});
	}),
	
	/**
     * Remove a carriable configuration from use in game
	 *
	 * @var
     * @type {express_route}
     */
	remove_bag_item : createRoute(["id"], function(req, res){
		//the validate.js constraints of all the properties
		var constraints = {
			id : {
				presence : true,
				numericality : {
					onlyInteger : true
				}
			}
		};
		
		//perform validation
		var allValid = validate(req.body, constraints);
		if(allValid){
			sendError(res, {err : ["Only a postitive numeric ID accepted"]});
			return;
		}
		
		//remove the item
		var path = config.carriables.getConfig(req.body.id, "directory");
		deleteFolderRecursive(path);
		
		res.json({"success": true});
	}),

	/**
     * Add a new status configuration for use in game (bloodsugar, etc)
	 *
	 * @var
     * @type {express_route}
     */
	add_status : createRoute(["name", "min_val", "max_val", "healthy_min", "healthy_max", "words"], function(req, res){
		//the validate.js constraints of all the properties
		var constraints = {
			name : {
				presence : true,
				format : /^[a-zA-Z\s]+$/
			}, min_val : {
				presence: true,
				numericality : {
					onlyInteger : true
				}
			}, max_val : {
				presence: true,
				numericality : {
					onlyInteger : true
				}
			}, healthy_min : {
				presence: true,
				numericality : {
					onlyInteger : true
				}
			}, healthy_max : {
				presence : true,
				numericality : {
					onlyInteger : true
				}
			}, isNumber : {
				presence: true,
			}
		};
		
		//define the variables used in this function
		if(!req.body.isNumber) req.body.isNumber = true;//!req.body.words;
		req.body.min_val = parseInt(req.body.min_val);
		req.body.max_val = parseInt(req.body.max_val);
		req.body.healthy_min = parseInt(req.body.healthy_min);
		req.body.healthy_max = parseInt(req.body.healthy_max);
		var properties = ["name", "min_val", "max_val", "healthy_min", "healthy_max", "isNumber", "words"];
		
		//validate
		var allValid = !validate(req.body, constraints);
		var wordsValid = req.body.isNumber || Object.keys(req.body.words).every(ele => validate.isInteger(ele));
		var valsValid = function(){
			var a = req.body;
			var valsOk = (a.min_val <= a.healthy_min) 
							&& (a.healthy_min <= a.healthy_max) 
							&& (a.healthy_max <= a.max_val);
			return valsOk;
		};
		if(!(allValid && wordsValid && valsValid())){
			sendError(res, allValid || {err : [(wordsValid ? "Please check your word values again." : "Mins and maxs must be in order!")]});
			return;
		}
		
		//all valid, proceed to create config
		var id = getRandomUnusedId(config.statuses);
		var obj = {};
		for(var i=0; i<properties.length; i++){
			obj[properties[i]] = req.body[properties[i]];
		}
		obj.id = id;
		
		createFiles(undefined, path.join("statuses", id.toString()), obj, undefined);
		
		res.json({"success": true});
	}),

	/**
     * Remove a status configuration from use in game
	 *
	 * @var
     * @type {express_route}
     */
	remove_status : createRoute(["id"], function(req, res){
		//the validate.js constraints of all the properties
		var constraints = {
			id : {
				presence : true,
				numericality : {
					onlyInteger : true
				}
			}
		};
		
		//perform validation
		var allValid = validate(req.body, constraints);
		if(allValid){
			sendError(res, {err : ["Only a postitive numeric ID accepted"]});
			return;
		}
		
		//remove the status
		var path = config.statuses.getConfig(req.body.id, "directory");
		deleteFolderRecursive(path);
		
		res.json({"success": true});
	}),

	/**
     * Add a condition configuration for use in game (diabetes, renal failure, etc)
	 *
	 * @var
     * @type {express_route}
     */
	add_condition : createRoute(["name", "statuses"], function(req, res){
		//the validate.js constraints of all the properties
		var constraints = {
			name : {
				presence : true
			}, statuses : {
				presence : true
			}
		};
		
		//set up variables
		var properties = ["name", "statuses"];
		if(isJsonString(req.body.statuses)) req.body.statuses = JSON.parse(req.body.statuses);
		
		//validate
		var allValid = !validate(req.body, constraints);
		var statusesValid = req.body.statuses.every(ele => validate.isInteger(ele));
		if(!(allValid && statusesValid)){
			sendError(res, allValid || {err : ['Check over the submitted statuses again']});
			return;
		}
		
		//make sure each status is unique ID
		req.body.statuses = req.body.statuses.filter(function(item, pos) {
			return req.body.statuses.indexOf(item) == pos;
		});
		
		//create the config
		var id = getRandomUnusedId(config.conditions);
		var obj = {};
		for(var i=0; i<properties.length; i++){
			obj[properties[i]] = req.body[properties[i]];
		}
		obj.id = id;
		createFiles(undefined, path.join("conditions", id.toString()), obj, undefined);
		
		res.json({"success": true});
	}),

	/**
     * Remove a condition configuration for use in game
	 *
	 * @var
     * @type {express_route}
     */
	remove_condition : createRoute(["id"], function(req, res){
		//the validate.js constraints of all the properties
		var constraints = {
			id : {
				presence : true,
				numericality : {
					onlyInteger : true
				}
			}
		};
		
		//perform validation
		var allValid = validate(req.body, constraints);
		if(allValid){
			sendError(res, {err : ["Only a postitive numeric ID accepted"]});
			return;
		}
		
		//remove the condition
		var path = config.conditions.getConfig(req.body.id, "directory");
		deleteFolderRecursive(path);
		
		res.json({"success": true});
	}),

	/**
     * Add a store item (non-carriable) configuration for use in game
	 *
	 * @var
     * @type {express_route}
     */
	add_store_item : createRoute(["name", "description", "slot", "price"], function(req, res){
		
		//the validate.js constraints of all the properties
		var constraints = {
			slot : {
				presence: true,
				inclusion : config.hub.getItemSlots()
			}, price : {
				presence: true,
				numericality : {
					onlyInteger : true
				}
			}
		};
		
		var properties = ["name", "description", "slot", "price"];
		req.body.price = parseInt(req.body.price);
		
		//perform validation
		var allValid = validate(req.body, constraints);
		if(allValid){
			sendError(res, allValid);
			return;
		}
		
		//copy relevant properties over to config object and write it to file
		var obj = {}, i;
		for(i=0; i<properties.length; i++){
			obj[properties[i]] = req.body[properties[i]];
		}
		obj.id = getRandomUnusedId(config.items);
		createFiles(req.file.path, path.join("items", req.body.slot, obj.id.toString()), obj, undefined);
		
		res.json({"success": true});
	}),

	/**
     * Remove a store item (non-carriable) configuration for use in game
	 *
	 * @var
     * @type {express_route}
     */
	remove_store_item : createRoute(["id"], function(req, res){
		//the validate.js constraints of all the properties
		var constraints = {
			id : {
				presence : true,
				numericality : {
					onlyInteger : true
				}
			}
		};
		
		//perform validation
		var allValid = validate(req.body, constraints);
		if(allValid){
			sendError(res, {err : ["Only a postitive numeric ID accepted"]});
			return;
		}
		
		//remove the store item
		var path = config.items.getConfig(req.body.id, "directory");
		deleteFolderRecursive(path);
		
		res.json({"success": true});
	})
};

/**
 * Contains functions that serve as endpoints for data generation to embed on in the client
 *
 * @namespace dataRoutes
 */
var dataRoutes = {
	/**
     * Returns all status config objects
	 *
	 * @var
     * @type {express_route}
     */
	get_all_statuses : function(req, res){
		var allStatuses = config.statuses.listAll().map(function(ele){
			return {id: ele.id, name: ele.name};
		});
		if(req.body.withHp) allStatuses.push({id: "hp", name : "hp"});
		
		res.status(200).json(allStatuses);
	},
	
	/**
     * Returns all carriable config objects
	 *
	 * @var
     * @type {express_route}
     */
	get_all_carriables : function(req, res){
		var allitems = config.carriables.listAll().map(item => {
			item.url = config.carriables.getSpriteURL(item.id);
			return {id: item.id, name: item.name, url: item.url};
		});
		
		res.status(200).json(allitems);
	},
	
	/**
     * Returns all condition config objects
	 *
	 * @var
     * @type {express_route}
     */
	get_all_conditions : function(req, res){
		res.status(200).json(config.conditions.listAll().map(function(ele){
			return {id: ele.id, name: ele.name};
		}));
	},
	
	/**
     * Returns a list of all item slots
	 *
	 * @var
     * @type {express_route}
     */
	get_item_slots : function(req, res){
		res.status(200).json(config.hub.getItemSlots());
	},
	
	/**
     * Returns all items config objects for a given slot
	 *
	 * @var
     * @type {express_route}
     */
	get_items_for_slot : function(req, res){
		if(config.hub.getItemSlots().indexOf(req.body.slot) > -1)
			res.status(200).json(config.items.listItemsForSlot(req.body.slot));
		else
			res.status(400).json({"success": false});
	}
};


/**
 * Generates a set of superuser-api routes and dataRoutes using the given config and database objects
 *
 * @param {module:config} cfg - A config object
 * @param {module:database} db - A database object
 *
 * @return {Object.<{
 *    routes: module:superuser-api~routes, dataRoutes: module:superuser-api~dataRoutes
 * }>} Object both routes and dataRoutes
 */
module.exports = function (cfg, db){
    setConfig(cfg);
    setDatabase(db);
	
    //set each route to be under /superuser
	var newDataRoutes = {};
	Object.keys(dataRoutes).forEach(function(key){
		var newRoute = "/superuser/" + key.toString();
		newDataRoutes[newRoute] = dataRoutes[key];
	});
	
    return {
		routes : routes,
		dataRoutes : newDataRoutes
	};
};
