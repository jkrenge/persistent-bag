const logToConsole = require('./util').logToConsole;
const BagUtil = require('./bag-util');

// prepare database and keep connection open

const MySQL = require('mysql');
var connection;

/**
 * object constructor
 * @param {String} host     MySQL host
 * @param {Number} port     MySQL port
 * @param {String} user     MySQL username
 * @param {String} password MySQL password for user
 * @param {String} db       name of the MySQL database
 */
function Database(host, port, user, password, db) {

  this.host = host;
  this.port = port;
  this.user = user;
  this.password = password;
  this.db = db;

  this.table = '`' + db + '`.`_persistent-bag`';

  this.handleDisconnect();

}

///////////////////////////////////
// Connection handling and setup //
///////////////////////////////////

/**
 * handles unwanted disconnects from MySQL to keep connection open
 */
Database.prototype.handleDisconnect = function() {
  logToConsole('Opening connection to MySQL...');
  const d = this;

  connection = MySQL.createConnection({
    host: this.host,
    port: this.port,
    user: this.user,
    password: this.password
  });

  connection.connect(function(err) {
    if (err) {
      logToConsole('Error on database connection', err);
      setTimeout(this.handleDisconnect, 2000);
    } else {

      logToConsole('Connected.');
      d.checkForDatastructure(function(datastructureExists) {
        if (!datastructureExists) d.createDatastructure();
      });

    }
  });

  connection.on('error', function(err) {
    logToConsole('Error on database connection: ', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      logToConsole('Attempting to reconnect...');
      this.handleDisconnect();
    } else {
      throw err;
    }
  });

};

/**
 * checks if the required datastructure already exists and gives the result in the callback
 * @param  {Function} callback
 */
Database.prototype.checkForDatastructure = function(callback) {
  logToConsole('Checking if datastructure exists...');

  const qry = 'SELECT id ' +
    'FROM ' + this.table +
    'LIMIT 1';

  connection.query(qry, function(err) {

    if (err) {
      logToConsole('Datastructure does not exist yet', err);
      callback(false);

    } else {
      logToConsole('Datastructure found.');
      callback(true);
    }

  });

};

/**
 * creates the required datastructure in the MySQL database through a new table
 */
Database.prototype.createDatastructure = function() {
  logToConsole('Creating datastructure...');

  const qry = 'CREATE TABLE ' + this.table + ' (' +
    '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,' +
    '`timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    '`hash` varchar(40) NOT NULL,' +
    '`payload` varchar(2048) NOT NULL,' +
    '`emitted` tinyint(1) NOT NULL DEFAULT \'0\',' +
    'PRIMARY KEY (`id`),' +
    'KEY `hash_index` (`hash`)' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8;';

  connection.query(qry, function(err) {

    if (err) logToConsole('Datastructure could not be created', err);
    else logToConsole('Datastructure created.');

  });

};

//////////////////////////
// Working on the piles //
//////////////////////////

Database.prototype.insertPayload = function(payload, callback) {

  const hash = BagUtil.createHash();

  const qry = 'INSERT INTO ' + this.table + ' (hash, payload) ' +
    'values(\'' + hash + '\', \'' + payload + '\')';

  connection.query(qry, function(err, result) {

    if (err) callback(err, null, hash);
    else callback(null, result.insertId, hash);

  });

};

Database.prototype.getHashes = function(callback) {

  const hash = BagUtil.createHash();

  const qry = 'SELECT DISTINCT(hash) ' +
    'FROM ' + this.table + ' ' +
    'WHERE emitted = 0';

  connection.query(qry, function(err, rows) {

    // FIXME: remove current hash

    callback(err, rows);

  });

};

Database.prototype.getDataForHash = function(hash, callback) {

  const qry = 'SELECT id, payload ' +
    'FROM ' + this.table + ' ' +
    'WHERE hash = \'' + hash + '\'';

  connection.query(qry, function(err, rows) {

    callback(err, rows);

  });

};

Database.prototype.setHashEmitted = function(hash, callback) {

  const qry = 'UPDATE ' + this.table +
    'SET emitted = 1 ' +
    'WHERE hash = \'' + hash + '\'';

  connection.query(qry, function(err) {

    callback(err);

  });

};

////////////
// Export //
////////////

module.exports = Database;
