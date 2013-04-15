var url = require('url');
var fs = require('fs');
var http = require('http');
var keys = require('./keys');
var util = require('./apputils');
var db = require('./database');

var server;
var status;
var debug = util.debug;

exports.start = function() {
  server = http.createServer(function(req, res) {
    request(req, res);
  });
  server.listen(keys.httpPort);
  status = true;
  util.log("Listening for GET requests on port: " + keys.httpPort);
  return db;
};

exports.getStatus = function() {
  return status;
};

var request = function(req, res) {
  var get = url.parse(req.url, true).query;
  
  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end();
    return;
  }
  
  debug("GET: Request receieved");
  
  res.writeHead(200); // Response header
  
  if (!get["auth"]) {
    debug("GET: Authenticaton token not set");
    res.end("false");
    return;
  }
  
  if (get["auth"] != keys.httpSecret) { // Authentication 
    debug("GET: Authentication token incorrect");
    res.end("cannotauth");
    return;
  }
  
  if (!get["action"]) {
    debug("GET: Action not set");
    res.end("Sorry, what?");
    return;
  }
  
  if (!status) {
    if (!(get["action"] == "setstatus" || get["auth"] == "getstatus")) {
      debug("GET: AdminListener is disabled");
      res.end("disabled");
      return;
    }
  }
  
  // ------------ setTwitter ------------ //
  if (get["action"] == "settwitter") {
    if (!(get["twitter"] && get["player"])) { // Not enough params
      res.end("false");
      return;
    }
    
    db.setTwitter(get["player"], get["twitter"].toLowerCase());
    res.end("ok");
    util.log("Set twitter: " + get["player"] + " - @" + get["twitter"]);
    return;
  }
  
  // ------------ getTwitter ------------ //
  if (get["action"] == "gettwitter") {
    debug("* GET: action=gettwitter");
    if (!get["player"]) {
      debug("* GET: Player not set");
      res.end("false");
      return;
    }
    
    db.containsPlayer(get["player"], function (contains) {
      if (!contains) {
        debug("* GET: Player not found");
        res.end("notfound");
      } else {
        db.getTwitter(get["player"], function(twitter) {
          debug("* GET: Found twitter: " + twitter["twitter"]);
          res.end(twitter["twitter"]);
        });
      }
    });
    return;
  }
  
  // ------------ delTwitter ------------ //
    if (get["action"] == "deltwitter") {
    
      if (!get["player"]) {
        res.end("false");
        return;
      }
      
      db.containsPlayer(get["player"], function (contains) {
        if (!contains) {
          res.end("notfound");
          return;
        }
      });
      
      db.deleteByPlayer(get["player"]);
      res.end("ok");
      util.log("Deleted twitter: " + get["player"] + " (" + get["twitter"] + ")");
      return;
    }
  
  // ------------ setStatus ------------ //
  if (get["action"] == "setstatus") {
    
    if (!get["status"]) {
      res.end("false");
      return;
    }
    
    if (get["status"] == "enabled") {
      status = true;
      util.log("SuperAdmin Adder was re-enabled by remote host");
    } else {
      util.log("SuperAdmin Adder was disabled by remote host", "warning");
      status = false;
    }
    res.end("ok");
    return;
  }
  
  // ------------ getStatus ------------ //
  if (get["action"] == "getstatus") {
    if (status) {
      res.end("enabled");
    } else {
      res.end("disabled");
    }
    return;
  }
  
  util.log("Unknown command issued: " + get["action"]);
  res.end("Sorry, what?");
}