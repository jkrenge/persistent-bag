const _config = require('../config');

const moment = require('moment');
const sha1 = require('sha1');

/**
 * creates the current hash based on the time
 * @return {String} hash, i.e. id, of the pile
 */
function createHash() {

  const intervalSize = _config.pileInterval;

  var timestamp = moment();
  var remainder = timestamp.minute() % intervalSize;
  var raw = timestamp.add(-remainder, 'minutes').format('YYYY-MM-DD-HH-mm');

  return sha1(raw);

}

function nextIterationDate() {

  const intervalSize = _config.pileInterval;

  var timestamp = moment();
  var remainder = intervalSize - (timestamp.minute() % intervalSize);
  var next = timestamp.add(remainder, 'minutes').seconds(45);

  return next.toDate();

}

////////////
// Export //
////////////

module.exports = {
  createHash: createHash,
  nextIterationDate: nextIterationDate
};
