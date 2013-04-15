var keys = require('./keys');
var util = require('./apputils');
var mongo = require('mongodb').MongoClient;
var debug = function (line) { util.debug(line); };
var url = keys.mongodbUrl;

var getCollection = function (callback) {
  callback = callback || function() {};
  debug("DB: Connecting to the database");
  mongo.connect(url, function(err, db) {
    if(err) {
      util.log("Could not connect to the database!", "fatal");
      debug("DB: " + err);
      util.log("Shutting down!", "fatal");
      process.exit(1);
    } else { debug("DB: Connected to the database"); }
    
    callback(db.collection("users"));
  });
};

var setTwitter = function (player, twitter, callback) {
  callback = callback || function() {};
  var doc = {"player": player, "twitter": twitter };
  
  containsPlayer(player, function (contains) {
    if (contains) {
      getCollection(function (coll) {
        coll.update({"player": player}, {"player": player, "twitter": twitter}, {w:1}, function (err, doc) {
          if (err) { log("Could not update document " + doc + "!", "severe"); throw err; }
          callback(err);
        });
      });
    } else {
      getCollection(function (coll) {
        coll.insert(doc, {w:1}, function (err) {
          if (err) { log("Could not add document " + doc + "!", "severe"); throw err; }
          callback(err);
        });
      });
    }
  });
};
exports.setTwitter = setTwitter;

var getTwitter = function (player, callback) {
  callback = callback  || function () {}
  getCollection(function (coll) { 
    coll.findOne({"player": player}, function(err, item) {
      if (err) { log("Could not retrieve document " + player + "!", "severe"); throw err; }
      debug("DB: getTwitter(" + player + ")" + " returned " + item);
      callback(item);
    });
  });
};
exports.getTwitter = getTwitter;

var getPlayer = function (twitter, callback) {
  callback = callback  || function () {}
  getCollection(function (coll) {
    coll.findOne({"twitter": twitter.toLowerCase()}, function(err, doc) {
      if (err) { log("Could not retrieve document " + twitter + "!", "severe"); throw err; }
      callback(doc["player"], err);
    });
  });
};
exports.getPlayer = getPlayer;

var deleteByPlayer = function (player, callback) {
  callback = callback  || function () {}
  getCollection(function (coll) {
    coll.remove({"player": player}, {w:1}, function (err) {
      if (err) { log("Could not delete document " + doc + "!", "severe"); throw err; }
      callback(err);
    });
  });
};
exports.deleteByPlayer = deleteByPlayer;

var containsTwitter = function (twitter, callback) {
  getCollection(function (coll) {
    debug("Attempting to find document: " + twitter.toLowerCase());
    coll.find({"twitter": twitter.toLowerCase()}).toArray(function (err, items) {
      if (err) {
        log("Could not query (containsTwitter) document " + twitter + "!", "severe");
        throw err;
      }
      if (items.length == 0) {
        debug("containsTwitter(" + twitter + ") returned false");
        callback(false);
      } else {
        debug("containsTwitter(" + twitter + ") returned true");
        callback(true)
      }
    });
    
  });
};
exports.containsTwitter = containsTwitter;

var containsPlayer = function (player, callback) {
  debug("DB: Checking if player exists: " + player);
  callback = callback || function() {};
  
  getCollection(function (coll) { 
    coll.find({"player": player}).toArray(function (err, items) {
      if (err) {
        debug("DB: Cannot check if database contains item: " + player);
        debug("DB: " + err);        
        log("Could not query (containsPlayer) document " + player + "!", "severe");
      }
      
      if (items.length == 0) {
        debug("DB: ContainsPlayer(" + player + ") returned false");
        callback(false);
      } else {
        debug("DB: ContainsPlayer(" + player + ") returned true");
        callback(true);
      }
      
    });
  });
};
exports.containsPlayer = containsPlayer;