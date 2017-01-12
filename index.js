/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

var modulename = {};

modulename.func = function func(options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = null;
  }

  if (!callback && typeof Promise === 'function') {
    // eslint-disable-next-line no-undef
    return new Promise(function(resolve, reject) {
      func(options, function(err, result) {
        if (err) { reject(err); } else { resolve(result); }
      });
    });
  }

  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  if (options !== undefined && typeof options !== 'object') {
    process.nextTick(function() {
      callback(new TypeError('options must be an object'));
    });
    return undefined;
  }

  // Do stuff
  return undefined;
};

module.exports = modulename;
