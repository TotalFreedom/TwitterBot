var keys = require('./keys');
var util = require('./apputils');
var al = require('./adminlistener');
var moment = require('moment');

var start = function() {
  util.log("-------");
  util.log("Starting up...");
  util.log("Rcon Host: " + keys.rconHost + ":" + keys.rconPort);
  util.log("Rcon Pass: " + keys.rconPass);
  util.log("Interval: " + util.getInterval()/1000/60 + " Minutes");
  util.debug("Twitter consumer key: " + keys.twitter["consumer_key"]);
  util.debug("Twitter consumer secret: " + keys.twitter["consumer_secret"]);
  util.debug("Twitter token key: " + keys.twitter["access_token_key"]);
  util.debug("Twitter token secret: " + keys.twitter["access_token_secret"]);
  util.log("Authenticating with twitter...");
  util.verifyCredentials(function (err, data) {
    if (err) {
      util.log("Could not authenticate with twitter!", "fatal");
      util.log(err, "fatal");
      util.log("Shutting down!", "fatal");
      process.exit(1);
    } else {
      util.log("Authenticated with username: @" + data["screen_name"]);
      
      al.start();
      util.startTwitter();
      util.startPing();
    }
  });

}

exports.getStatus = function () {
  return al.getStatus();
};

start();