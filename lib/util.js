const _ = require('underscore');

/**
 * logs to console with timestamp
 * @param  {String} string message to log to console
 * @param  {Object} additional object to log as well
 */
function logToConsole(string, object) {
  console.log(new Date().toISOString() + ' > ' + string + (_.isObject(object) ? ': ' + JSON.stringify(object) : ''));
}

////////////
// Export //
////////////

module.exports = {
  logToConsole: logToConsole
};
