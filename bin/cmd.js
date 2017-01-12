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

/** Options for command entry points.
 *
 * @typedef {{
 *   in: (stream.Readable|undefined),
 *   out: (stream.Writable|undefined),
 *   err: (stream.Writable|undefined)
 * }} CommandOptions
 * @property {stream.Readable=} in Stream from which input is read. (default:
 * <code>process.stdin</code>)
 * @property {stream.Writable=} out Stream to which output is written.
 * (default: <code>process.stdout</code>)
 * @property {stream.Writable=} err Stream to which errors (and non-output
 * status messages) are written. (default: <code>process.stderr</code>)
 */
// var CommandOptions;

/** Entry point for this command.
 *
 * @param {!Array<string>} args Command-line arguments.
 * @param {CommandOptions=} options Options.
 * @param {?function(Error, number=)=}
 * callback Callback for the exit code or an <code>Error</code>.  Required if
 * <code>global.Promise</code> is not defined.
 * @return {Promise<number>|undefined} If <code>callback</code> is not given
 * and <code>global.Promise</code> is defined, a <code>Promise</code> with the
 * exit code or <code>Error</code>.
 */
function modulenameCmd(args, options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = null;
  }

  if (!callback && typeof Promise === 'function') {
    // eslint-disable-next-line no-undef
    return new Promise(function(resolve, reject) {
      modulenameCmd(args, options, function(err, result) {
        if (err) { reject(err); } else { resolve(result); }
      });
    });
  }

  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  try {
    if (args === undefined ||
        args === null ||
        (typeof args === 'object' && args.length === 0)) {
      args = [];
    } else if (typeof args !== 'object' ||
               Math.floor(args.length) !== args.length ||
               args.length < 2) {
      throw new TypeError('args must be Array-like with at least 2 elements');
    } else {
      args = Array.prototype.slice.call(args, 2).map(String);
    }

    if (options !== undefined && typeof options !== 'object') {
      throw new TypeError('options must be an object');
    }

    options = Object.assign(
      {
        in: process.stdin,
        out: process.stdout,
        err: process.stderr
      },
      options
    );

    if (!options.in || typeof options.in.on !== 'function') {
      throw new TypeError('options.in must be a stream.Readable');
    }
    if (!options.out || typeof options.out.write !== 'function') {
      throw new TypeError('options.out must be a stream.Writable');
    }
    if (!options.err || typeof options.err.write !== 'function') {
      throw new TypeError('options.err must be a stream.Writable');
    }
  } catch (err) {
    process.nextTick(function() {
      callback(err);
    });
    return undefined;
  }

  var command = new Command()
    .description('Does the thing with the thing and stuff.')
    // .arguments() splits on white space.  Call .parseExpectedArgs directly.
    .parseExpectedArgs(['<arg name>'])
    .option('-q, --quiet', 'print less output')
    .option('-v, --verbose', 'print more output')
    .version(packageJson.version);

  // Patch stdout, stderr, and exit for Commander
  // See: https://github.com/tj/commander.js/pull/444
  var exitDesc = Object.getOwnPropertyDescriptor(process, 'exit');
  var stdoutDesc = Object.getOwnPropertyDescriptor(process, 'stdout');
  var stderrDesc = Object.getOwnPropertyDescriptor(process, 'stderr');
  var errExit = new Error('process.exit() called');
  process.exit = function throwOnExit(exitCode) {
    errExit.exitCode = Number(exitCode) || 0;
    throw errExit;
  };
  if (options.out) {
    Object.defineProperty(
        process,
        'stdout',
        {configurable: true, enumerable: true, value: options.out}
    );
  }
  if (options.err) {
    Object.defineProperty(
        process,
        'stderr',
        {configurable: true, enumerable: true, value: options.err}
    );
  }
  try {
    command.parse(args);
  } catch (errParse) {
    process.nextTick(function() {
      if (errParse !== errExit) {
        // Match commander formatting for consistency
        options.err.write('\n  error: ' + errParse.message + '\n\n');
      }
      callback(
        null,
        typeof errParse.exitCode === 'number' ? errParse.exitCode : 1
      );
    });
    return undefined;
  } finally {
    Object.defineProperty(process, 'exit', exitDesc);
    Object.defineProperty(process, 'stdout', stdoutDesc);
    Object.defineProperty(process, 'stderr', stderrDesc);
  }

  if (command.args.length !== 1) {
    callback(new Error('Exactly one argument is required.\n' +
          command.helpInformation()));
    return undefined;
  }

  // Parse arguments then call API function with parsed options
  modulename(command, callback);
  return undefined;
}

modulenameCmd.default = modulenameCmd;
module.exports = modulenameCmd;

if (require.main === module) {
  // This file was invoked directly.
  /* eslint-disable no-process-exit */
  var mainOptions = {
    in: process.stdin,
    out: process.stdout,
    err: process.stderr
  };
  modulenameCmd(process.argv, mainOptions, function(err, exitCode) {
    if (err) {
      if (err.stdout) { process.stdout.write(err.stdout); }
      if (err.stderr) { process.stderr.write(err.stderr); }
      process.stderr.write(err.name + ': ' + err.message + '\n');

      exitCode = typeof err.exitCode === 'number' ? err.exitCode : 1;
    }

    process.exit(exitCode);
  });
}
