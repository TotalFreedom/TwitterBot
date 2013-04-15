var keys = require("./keys");
var logentries = require('node-logentries');
var moment = require('moment');
var twitter = require('ntwitter');
var rcon = require('rcon');
var db = require('./database');
var server = require('./server');
var server = require('./server');

// vars
var interval = 5*60*1000 //millisec
var debugState = false;
exports.getInterval = function() { return interval; };
var fails = 0;

var logger = logentries.logger({
  token: keys.logEntriesToken,
  levels: {
    debug:0, info:1, warning:2, severe:3, fatal:4
  }
});

var twitterApi = new twitter(keys.twitter);

//////////////////////////
var verifyCredentials = function(callback) {
  twitterApi.verifyCredentials(callback);
}
exports.verifyCredentials = verifyCredentials;

var log = function (message, level) {
  logger.log(level || "info", message);
  var time = moment().format("DD MMM HH:mm:ss");
  console.log(time + " - " + message);
};
exports.log = log;

var debug = function (message) {
  if (!debugState) { return; }
  var time = moment().format("DD MMM HH:mm:ss");
  console.log(time + " - [DEBUG] " + message);
};
exports.debug = debug;

// Twitter Starter
var startTwitter = function(db) {
  this.db = db;
  
  twitterApi.stream('statuses/filter', {'track':'@TFUpdates #superme'}, function(stream) {
    
    // listeners
    stream.on('data', onTwitterFeed);
    stream.on('end', function (response) {
      log("Disconnected from the twitter API!", "fatal");
      log("Shutting down!", "fatal");
      process.exit(1);
    });
    stream.on('destroy', function (response) {
      log("Disconnected from the twitter API!", "fatal");
      log("Shutting down!", "fatal");
      process.exit(1);
    });
    
  });
  
}
exports.startTwitter = startTwitter;

// ServerPing Starter
var startPing = function() {
  ping(true);
  setInterval(ping, interval);
}
exports.startPing = startPing;

var onTwitterFeed = function(data) {
  var twitter = data["user"]["screen_name"];
  
  log("Received re-super request from: @" + twitter);
  
  db.containsTwitter(twitter, function (contains) {
    if(!contains) {
      log("Denying re-super request from @" + twitter + " (Not in database)");
      return;
    }
    var player = db.getPlayer(twitter, function(player) {
      if (!server.getStatus()) {
        log("Denying re-super request from @" + twitter + " (Admin Listener is disabled)");
        tweet("@" + twitter + " Twitterbot could not resuper you as it is currently disabled (" +  moment().format("DD MMM HH:mm:ss") + ")");
        return;
      }
      
      log("Verified @" + twitter + " (" + player + ") as a SuperAdmin");
      tweet("Verified @" + twitter + " as a SuperAdmin on " + moment().format("DD MMM HH:mm:ss"));
      
      var socket = new rcon(keys.rconHost, keys.rconPort, keys.rconPass);
      socket.on('auth', function() {
        console.log("Authenticated with Rcon");
        socket.send("csay TwitterBot - Authenticated player as a SuperAdmin".replace("player", player));
        socket.send("saconfig add player".replace("player", player));
        socket.disconnect();
      });
      socket.on('error', function() {
        log("Could not connect to Rcon", "severe");
      });
      socket.on('response', function(res) {
        if(res) {
          log("Could not add SuperAdmin: " + player, "severe");
        }
      });
      socket.connect();
    });
  });
};
      

      
var ping = function(forceOutput) {
  var socket = new rcon(keys.rconHost, keys.rconPort, keys.rconPass);
  socket.on('auth', function() {
    if (forceOutput && fails == 0) { log("Server is Online"); }
    if (fails != 0) { log("Server is back Online"); }
    fails = 0;
    socket.disconnect();
    return;
  });
  socket.on('error', function() {
    fails += 1;
    log("Server dectected offline! ("+fails+")", "warning");
    if(fails % 2 === 0){
      tweet("@TotalFreedomMC server has been down for "+fails*interval/60/1000+" minutes");
	    log("Tweeted @TotalFreedomMC about the downtime");
    }
    if(fails % 5 === 0) {
      tweet("@disaster839 @Wild1145 @jackofhallow @Robolawrence @TheCJGCJG The server has been down for "+fails*interval/60/1000+" minutes");
	    log("Tweeted @disaster839, @Wild1145, @jackofhallow, @Robolawrence, @TheCJGCJG about the downtime");
    }
    return;
  });
  
  socket.connect();
}
exports.ping = ping;

var tweet = function(string) {
  twitterApi.updateStatus(string, function(err, data) {
    if (err) {
      log("Could not send tweet!", "fatal");
      console.log(err);
    }
  });
}
exports.tweet = tweet;
