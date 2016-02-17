#!/usr/bin/env node
/**
 * An NPM script which will be run from scripts in package.json.
 *
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */
'use strict';

/** Entry point for this command.
 *
 * @param {!Array<string>} args Command-line arguments.
 * @param {?function(Error, {code:?number, stdout:?string, stderr:?string}=)=}
 * callback Callback for the command result or error.  Required if
 * <code>global.Promise</code> is not defined.
 * @return {Promise} If <code>callback</code> is not given and
 * <code>global.Promise</code> is defined, a <code>Promise</code> which will
 * resolve on completion.
 */
function scriptname(args, callback) {
  if (!callback && typeof Promise === 'function') {
    return new Promise(function(resolve, reject) {
      scriptname(args, function(err, result) {
        if (err) reject(err); else resolve(result);
      });
    });
  }

  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }
}

module.exports = scriptname;

if (require.main === module) {
  // This file was invoked directly.
  /* eslint-disable no-process-exit */
  scriptname(process.argv, function(err, result) {
    var errOrResult = err || result;
    if (errOrResult.stdout) process.stdout.write(errOrResult.stdout);
    if (errOrResult.stderr) process.stderr.write(errOrResult.stderr);
    if (err) process.stderr.write(err.name + ': ' + err.message + '\n');

    var code = typeof errOrResult.code === 'number' ? errOrResult.code :
                err ? 1 : 0;
    process.exit(code);
  });
}
