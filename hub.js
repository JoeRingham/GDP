"use strict";

/* File to handle the buiness logic of the server side application
 * Each session has a hub object that deals with it's interaction with the application
 * and acts as a proxy for loading the minigames
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

var locations = {
    IN_HUB : 0,
    IN_MINIGAME : 1
};

function Hub(userId, comms){
    if(!userId || !comms){
        throw new Error("UserId and comms must be defined");
    }

    this.userId = userId;
    this.user = null;

    this.bag = new Bag();

    this.health = {};

    // Where the player currently resides, always starts in the hub
    this.location = locations.IN_HUB;

    // The minigame ID that the player is currently in
    this.gameId = null;

    // The time the player started the current game
    this.gameStartTime = null;

    // Time they logged on (this object was created)
    this.connectedTime = new Date();

    // Get the user data from the db
    db.createSession(function(){},
                        function(){},
                            {userId: userId, start_time: this.connectedTime.toISOString()}
                    );


};
// Set the locations as "class constants"
Hub.locations = locations;


Hub.prototype.exit = function(){
    // Cleanup code when a client disconnects

    // Save session data in db
    var disconnectTime = new Date();

    db.endSession(function(){}, function(){}, disconnectTime.toISOString(), this.userId);
};

// Define functions here
Hub.prototype.eventListeners = {
    //options are unused, here for completions sake. Can be implemented in future for
    //options such as colour blindness etc.
    //UNUSED
    get_options : function(data, fn){
        fn({});
    },
    //UNUSED
    set_options : function(data, fn){
        fn({});
    },

    get_all_item_info : function(data, fn){
        fn(config.items.listAll());
    },

    get_single_item_info : function(data, fn){
        fn(config.items.getConfig(data.id, undefined));
    },
	
	get_user_unlocked_items : function(data, fn){
		db.getInventoryForUser(
			function(results){
				fn(results);
			}, function(err){
				fn({err: err});
			},
			this.userId
		);
	},

    get_user_equipped_items : function(data, fn){
        db.getEquippedForUser(
            function(results){
				var sendBack = {head: results.head, eyes: results.eyes, skin: results.skin, shirt:results.shirt};
				fn(sendBack);

            },
            function(){
				fn({err: "Error in db"});
            },
            this.user_id
        );
    },

    update_equipped_items : function(data, fn){
		var invObj = {
			user_id : this.userId,
			head: data.head,
			eyes: data.eyes,
			skin: data.skin,
			shirt: data.shirt
		};
		
		db.createEqippedItems(
			function(results){
				fn({success: "success"});
			}, function(){
				fn({err: "Error in db"});
			},
			invObj
		);
    },

    get_bag : function(data, fn){
        fn( {items: this.bag.getItems()} );
    },

    set_bag : function(data, fn){
        this.bag.setItems(data.items);

        fn();
    },

    list_minigames : function(data, fn){
        fn(config.games.listAll());
    },

    launch_minigame : function(data, fn){
        // Get all of the items required for the game and send them to the client
        var id = data.gameId;

        if(config.games.exists(id)){
            var name = config.games.getName(id),
                assetBaseURL = config.games.getAssetsBaseURL(id),
                scriptURLs = config.games.getScripts(id),
                entryObject = config.games.getEntryObject(id),
                version = config.games.getConfig(id, "version");


            // Set the game we are in
            this.location = Hub.locations.IN_MINIGAME;
            this.gameId = id;
            this.gameStartTime = new Date();

            fn({
                gameId : id,
                name : name,
                assetBaseURL : assetBaseURL,
                scriptURLs : scriptURLs,
                entryObject : entryObject,
                version : version
            });
        }else{
            fn({
                err : "No game with that ID"
            });
        }
    },

    finish_minigame : function(data, fn){
        var id = data.gameId,
            score = data.score;

        if(id === this.gameId){
            var playObj = { user_id: this.userId,
                            game_id: id,
                            start_time: this.gameStartTime.toISOString(),
                            end_time: (new Date()).toISOString(),
                            score: score
                        };

            this.location = Hub.locations.IN_HUB;
            this.gameId = undefined;
            this.gameStartTime = undefined;

            //update the users currency
            db.readUserById(function(result){
                                db.updateUserCurrency(function(){}, function(){}, result.currency+data.currency, this.user_id);
                            },
                            function(err){
                                fn( {err: "Error reading user ID or "} );
                            },
                            this.user_id
            );

            // Save score in database
            db.createPlay(  function(){ fn(); },
                            function(){ fn({err: "An error occured"}); },
                            playObj
                        );
        }else{
            fn({
                err : "Game ID supplied does not match the server's"
            });
        }
    },

    get_scores : function(data, fn){
        var numOfScores = 100;

        var filterConds = {};

        if(data.option_num === 0){
            //get top 100 overall scores
            filterConds = {};
        }else if(data.option_num === 1){
            //filtering on user for all games
            filterConds = {game_id: data.game_id};
        }else if(data.option_num === 2){
            filterConds = {user_id: data.user_id};
        }else if(data.option_num === 3){
            filterConds = {user_id: data.user_id, game_id: data.game_id}
        }else{
            fn({err: "Invalid score option selected"});
        }

        db.getScores(   function(results){
                            fn({data: results});
                        },
                        function(err){ fn({err: "Error accessing database entries" }); },
                        filterConds,
                        {column: "score", direction: "DESC"},
                        numOfScores
                    );
    },

    set_hp : function(data, fn){

    },

    set_status : function(data, fn){

    }
};



/* Class representing a 'bag', that is the items the player currently holds */
function Bag(){
    // Modelled as an array of items contained in the bag
    var items = [];

    function getItems(){
        return this.items;
    }

    function setItems(itemArray){
        if(Array.isArray(itemArray)) this.items = itemArray;
    }
}



module.exports = function (cfg, db){
    setConfig(cfg);
    setDatabase(db);

    return {
        setConfig : setConfig,
        getConfig : getConfig,
        setDatabase : setDatabase,
        getDatabase : getDatabase,

        // Creates a new hub object and assigns the event listeners to the given comms object
        create : function (userId, comms){
            var h = new Hub(userId, comms);

            // Set up the hub event listeners for the comms module
            comms.setEventListeners(h.eventListeners);

            return h;
        }
    };
};

