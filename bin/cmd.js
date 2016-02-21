#!/usr/bin/env node
/**
 * An executable command which will be added to $PATH.
 *
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */
'use strict';

var Command = require('commander').Command;
var modulename = require('..');
var packageJson = require('../package.json');

/** Result from command entry points.
 *
 * @typedef {{
 *   code: (?number|undefined),
 *   stdout: (?string|undefined),
 *   stderr: (?string|undefined)
 * }} CommandResult
 * @property {?number=} code Exit code for the command.
 * @property {?string=} stdout Content to write to stdout.
 * @property {?string=} stderr Content to write to stderr.
 */

/** Entry point for this command.
 *
 * @param {!Array<string>} args Command-line arguments.
 * @param {?function(Error, ?CommandResult=)=}
 * callback Callback for the command result or error.  Required if
 * <code>global.Promise</code> is not defined.
 * @return {Promise|undefined} If <code>callback</code> is not given and
 * <code>global.Promise</code> is defined, a <code>Promise</code> which will
 * resolve on completion.
 */
function modulenameCmd(args, callback) {
  if (!callback && typeof Promise === 'function') {
    return new Promise(function(resolve, reject) {
      modulenameCmd(args, function(err, result) {
        if (err) reject(err); else resolve(result);
      });
    });
  }

  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  // TODO:  Proxy console.{error,log} and process.exit so we can return result
  var command = new Command()
    .description('Does the thing with the thing and stuff.')
    // .arguments() splits on white space.  Call .parseExpectedArgs directly.
    .parseExpectedArgs(['<arg name>'])
    .option('-q, --quiet', 'print less output')
    .option('-v, --verbose', 'print more output')
    .version(packageJson.version)
    .parse(args);

  if (command.args.length !== 1) {
    callback(new Error('Exactly one argument is required.\n' +
          command.helpInformation()));
    return undefined;
  }

  // Parse arguments and call API function with parsed options
  modulename();
  return undefined;
}

module.exports = modulenameCmd;

if (require.main === module) {
  // This file was invoked directly.
  /* eslint-disable no-process-exit */
  modulenameCmd(process.argv, function(err, result) {
    var errOrResult = err || result;
    if (errOrResult.stdout) process.stdout.write(errOrResult.stdout);
    if (errOrResult.stderr) process.stderr.write(errOrResult.stderr);
    if (err) process.stderr.write(err.name + ': ' + err.message + '\n');

    var code = typeof errOrResult.code === 'number' ? errOrResult.code :
                err ? 1 : 0;
    process.exit(code);
  });
}
