"use strict";

/* File implements routes for the superuser handling via a http RESTful API
 */

var fs = require("fs");
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

function checkIsValid(arrNames, objToTest){
	var invalid = [];
	
	for(var i=0; i<arrNames.length; i++){
		if(objToTest[arrNames[i]] === undefined) invalid.push(arrNames[i]);
	}
	
	return invalid.join(", ");
}

function returnInvalidMessage(res, message){
	res.status(400).json({
		"error" : "Request body not valid - missing: " + message
	});
}

function getRandomUnusedId(configObj){
	var newId = undefined;
	while(!newId){
		var currentId = Math.floor(Math.random() * 32767);
		
		if(configObj.getConfig(currentId) === null){
			newId = currentId;
		}
	}
	return newId;
}

function createFiles(spriteLoc, newLoc, configObj, otherFiles){
	newLoc = __dirname + newLoc + "/";
	
	fs.mkdir(newLoc, function(err){
		fs.readFile(spriteLoc, function (err, data) {
			var newPath = newLoc + "sprite.png";
			fs.writeFile(newPath, data, function (err) {
			});
			
			fs.unlink(spriteLoc, function(err){});
		});
		
		fs.writeFile(newLoc + "config.json", JSON.stringify(configObj), function(err){
		});
		
		if(otherFiles){
			
		}
	});
}

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function removeFiles(path){
	fs.unlink(path + "/config.json", function(err){
		fs.unlink(path + "/sprite.png", function(err){
			//fs.rmdir(path, function(err){});
		});
	});
}

/****** Route functions ******/
var routes = {
	
	add_bag_item : function(req, res){		
		var properties = ["name", "effects"];
		var valid = checkIsValid(properties, req.body);
		if(valid){
			req.body.effects = JSON.parse(req.body.effects);
			
			var obj = {};
			for(var i=0; i<properties.length; i++){
				obj[properties[i]] = req.body[properties[i]];
			}
			obj.id = getRandomUnusedId(config.carriables);;
			
			createFiles(req.file.path, "/carriables/" + obj.id.toString(), obj, undefined);

			res.json({"okay": "A OK!"});
		}else{
			returnInvalidMessage(res, valid);
		}
	},

	remove_bag_item : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		
		if(valid){
			var path = config.carriables.getConfig(req.body.id, "directory");
			
			removeFiles(path);
			
			res.json({"okay": "A OK!"});
		}else{
			returnInvalidMessage(res, valid);
		}
	},

	add_status : function(req, res){
		var properties = ["name", "min_val", "max_val", "healthy_min", "healthy_max", "isNumber", "words"];
		var valid = checkIsValid(properties, req.body);
		if(valid){
			var id = getRandomUnusedId(config.statuses);
			var obj = {};
			for(var i=0; i<properties.length; i++){
				obj[properties[i]] = req.body[properties[i]];
			}
			obj.id = id;
			
			createFiles(req.file.path, "/statuses/" + id.toString(), obj, undefined);
		}else{
			returnInvalidMessage(res, valid);
		}
	},

	remove_status : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		if(valid){
			var path = config.statuses.getConfig(req.body.id, "directory");
			
			removeFiles(path);
			
			res.json({"okay": "A OK!"});
		}else{
			returnInvalidMessage(res, valid);
		}
	},

	add_condition : function(req, res){
		var valid = checkIsValid(["name", "statuses"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res, valid);
		}
	},

	remove_condition : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		if(valid){
			var path = config.conditions.getConfig(req.body.id, "directory");
			
			removeFiles(path);
			
			res.json({"okay": "A OK!"});
		}else{
			returnInvalidMessage(res, valid);
		}
	},

	add_store_item : function(req, res){
		var valid = checkIsValid(["name", "description", "slot", "price", "sprite"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res, valid);
		}
	},

	remove_store_item : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		if(valid){			
			var path = config.items.getConfig(req.body.id, "directory");
			
			removeFiles(path);
			
			res.json({"okay": "A OK!"});
		}else{
			returnInvalidMessage(res, valid);
		}
	},
	/*
	add_minigame : function(req, res){
		var valid = checkIsValid(["id", "name", "description", "img", "scripts", "entry_point"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res, valid);
		}
	},

	remove_minigame : function(req, res){
		var valid = checkIsValid(["id"], req.body);
		if(valid){
			
		}else{
			returnInvalidMessage(res, valid);
		}
	}
	*/
};

var dataRoutes = {
	get_all_statuses : function(req, res){
		res.status(200).json(config.statuses.listAll());
	},
	
	get_all_carriables : function(req, res){
		var allitems = config.carriables.listAll();
		allitems = allitems.map(function(item){
			item.url = config.carriables.getSpriteURL(item.id);
			delete item.effects;
			return item;
		});
		
		res.status(200).json(allitems);
	},
	
	get_all_conditions : function(req, res){
		res.status(200).json(config.conditions.listAll());
	},
	
	get_item_slots : function(req, res){
		res.status(200).json(config.hub.getItemSlots());
	},
	
	get_items_for_slot : function(req, res){
		if(config.hub.getItemSlots().indexOf(req.body.slot) > -1)
			res.status(200).json(config.items.listItemsForSlot(req.body.slot));
		else
			res.status(400).json({"success": false});
	}
	
};

module.exports = function (cfg, db){
    setConfig(cfg);
    setDatabase(db);
    
    return {
		routes : routes,
		dataRoutes : dataRoutes
	}
};
