const logToConsole = require('./lib/util').logToConsole;

const BagUtil = require('./lib/bag-util');

const DB = require('./lib/database');
var database;

const Async = require('async');
const moment = require('moment');

/////////////////////
// Bag interaction //
/////////////////////

/**
 * constructs a bag object to be used
 * @param {Object} connection MySQL connection data
 */
function PersistentBag(connection) {

  database = new DB(connection.host, connection.port, connection.user, connection.password, connection.database);

}

/**
 * adds data to the bag
 * @param  {Object} payload the data to add
 */
PersistentBag.prototype.add = function(payload, callback) {

  database.insertPayload(JSON.stringify(payload), function(err, dataId, hash) {
    if (err) {
      logToConsole('Error when adding data to bag ' + hash, err);
      callback(err, null);

    } else {
      logToConsole('Added data to bag ' + hash + ' with id ' + dataId);
      callback(null, dataId);
    }
  });

};

PersistentBag.prototype.process = function(worker) {
  var bag = this;

  getBags(function(err_getBags, baghashes) {
    Async.eachSeries(baghashes, function iterator(baghash, cb_esa) {

      getBag(baghash, function(err_getBag, data) {

        worker(data, function done(err_done) {

          if (err_done) {
            logToConsole('Error when processing bag ' + baghash, err_done);
            cb_esa();

          } else {

            setBagAsDone(baghash, function (err_setBagAsDone) {
              cb_esa();
            });

          }

        });

      });

    }, function(err_esa) {
      if (err_esa) logToConsole('Error when iterating bags', err_esa);

      var nextIteration = BagUtil.nextIteration();
      setInterval(function () {
        bag.process(worker);
      }, nextIteration);
    });

  });

};

////////////////////////
// Internal functions //
////////////////////////

function getBags(callback) {

  database.getHashes(function(err, rows) {

    if (err) {
      logToConsole('Error when getting bags to emit', err);
      callback(err, null);
    } else {

      var result = [];
      rows.forEach(function(row) {
        result.push(row.hash);
      });

      callback(null, result);

    }

  });

}

function getBag(hash, callback) {

  database.getDataForHash(hash, function(err, rows) {

    if (err) {
      logToConsole('Error when getting data from bag ' + hash, err);
      callback(err, null);
    } else {

      var result = [];
      rows.forEach(function(row) {
        result.push(JSON.parse(row.payload));
      });

      callback(null, {
        bag: hash,
        data: result
      });

    }

  });

}

function setBagAsDone(hash, callback) {

  database.setHashEmitted(hash, function(err) {

    if (err) {
      logToConsole('Error when marking bag ' + hash + ' as done', err);
      callback(err);

    } else callback(null);

  });

}

////////////
// Export //
////////////

module.exports = PersistentBag;
