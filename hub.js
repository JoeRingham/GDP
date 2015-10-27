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

    // Get the user data from the db



};
// Set the locations as "class constants"
Hub.locations = locations;


Hub.prototype.exit = function(){
    // Cleanup code when I client disconnects
};

// Define functions here
Hub.prototype.eventListeners = {
    getGamesList : function(data, fn){
        fn(config.games.listAll());
    },

    getItemsList : function(data, fn){
        fn(config.items.listAll());
    },

    launchGame : function(data, fn){
        // Get all of the items required for the game and send them to the client
        var id = data.gameId;

        if(config.games.exists(id)){
            var name = config.games.getName(id),
                assetBaseURL = config.games.getAssetsBaseURL(id),
                scriptURLs = config.games.getScripts(id),
                entryObject = config.games.getEntryObject(id);

            fn({
                gameId : id,
                name : name,
                assetBaseURL : assetBaseURL,
                scriptURLs : scriptURLs,
                entryObject : entryObject
            });
        }else{
            fn({
                err : "No game with that ID"
            })
        }
    }

};



/* Class representing a 'bag', that is the items the player currently holds */
function Bag(){
    // Modelled as an array of items contained in the bag
    var items = [];
}

var getItem = (function(){
    var requirements = ["id", "name", "effect", "sprite"];

    /* Class representing an Item in the bag */
    function Item(definition){
        // Check for required items in the definition
        requirements.forEach(function(i){
            if(!definition[i]){
                throw new Error("Item requires " + i + " in config file");
            }
        });

        var sprite = config.item.getSpriteURL();

        this.getId = function(){
            return definition.id;
        };

        this.getName = function(){
            return definition.name;
        };

        this.getSpriteURL = function(){
            return sprite;
        };

    }

    return function getItem(id){
        return new Item(config.item.getItemConfig(id));
    };

})();




module.exports = function (cfg){
    setConfig(cfg);

    return {
        setConfig : setConfig,
        getConfig : getConfig,

        // Creates a new hub object and assigns the event listeners to the given comms object
        create : function (userId, comms){
            var h = new Hub(userId, comms);

            // Set up the hub event listeners for the comms module
            comms.setEventListeners(h.eventListeners);

            return h;
        }
    };    
};

