// RCON
exports.rconHost = ""; // rcon hostname
exports.rconPort = 123; // rcon port
exports.rconPass = ""; // rcon password

// HTTP
exports.httpPort = process.env["app_port"] || 8080; // leave this
exports.httpSecret = "Http secret"; // set in config.yml on the server

// LOGENTRIES
exports.logEntriesToken = ""; // you probably won't need this

// MONGODB DATABASE
exports.mongodbUrl = ""; // mongodb url

// TWITTER: TFUpdates
exports.twitter = { // twitter information
  consumer_key: "",
  consumer_secret: "",
  access_token_key: "",
  access_token_secret: ""
};