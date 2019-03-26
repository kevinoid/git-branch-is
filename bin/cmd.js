#!/usr/bin/env node
/**
 * An executable command which will be added to $PATH.
 *
 * @copyright Copyright 2017 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const Yargs = require('yargs/yargs');
const packageJson = require('../package.json');
const modulename = require('..');

/** Calls <code>yargs.parse</code> and passes any thrown errors to the callback.
 * Workaround for https://github.com/yargs/yargs/issues/755
 * @private
 */
function parseYargs(yargs, args, callback) {
  // Since yargs doesn't nextTick its callback, this function must be careful
  // that exceptions thrown from callback (which propagate through yargs.parse)
  // are not caught and passed to a second invocation of callback.
  let called = false;
  try {
    yargs.parse(args, function(...cbargs) {
      called = true;
      return callback.apply(this, cbargs);
    });
  } catch (err) {
    if (called) {
      // err was thrown after or by callback.  Let it propagate.
      throw err;
    } else {
      callback(err);
    }
  }
}

/** Options for command entry points.
 *
 * @typedef {{
 *   stdin: !stream.Readable,
 *   stdout: !stream.Writable,
 *   stderr: !stream.Writable
 * }} CommandOptions
 * @property {!stream.Readable} stdin Stream from which input is read.
 * @property {!stream.Writable} stdout Stream to which output is written.
 * @property {!stream.Writable} stderr Stream to which errors and non-output
 * status messages are written.
 */
// const CommandOptions;

/** Entry point for this command.
 *
 * @param {Array<string>} args Command-line arguments.
 * @param {!CommandOptions} options Options.
 * @param {function(number)} callback Callback with exit code.
 */
function modulenameCmd(args, options, callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  if (args !== undefined
      && args !== null
      && Math.floor(args.length) !== args.length) {
    throw new TypeError('args must be Array-like');
  }

  if (!options || typeof options !== 'object') {
    throw new TypeError('options must be an object');
  }

  if (!options.stdin || typeof options.stdin.on !== 'function') {
    throw new TypeError('options.stdin must be a stream.Readable');
  }
  if (!options.stdout || typeof options.stdout.write !== 'function') {
    throw new TypeError('options.stdout must be a stream.Writable');
  }
  if (!options.stderr || typeof options.stderr.write !== 'function') {
    throw new TypeError('options.stderr must be a stream.Writable');
  }

  if (args.length >= 2) {
    // Strip "node" and script name, ensure args are strings
    args = Array.prototype.slice.call(args, 2).map(String);
  } else {
    args = [];
  }

  // Workaround for https://github.com/yargs/yargs/issues/783
  // Necessary because mocha package.json overrides .parserConfiguration()
  require.main = module;
  const yargs = new Yargs(null, null, require)
    .parserConfiguration({
      'parse-numbers': false,
      'duplicate-arguments-array': false,
      'flatten-duplicate-arrays': false
    })
    .usage('Usage: $0 [options] [args...]')
    .help()
    .alias('help', 'h')
    .alias('help', '?')
    .option('quiet', {
      alias: 'q',
      describe: 'Print less output',
      count: true
    })
    .option('verbose', {
      alias: 'v',
      describe: 'Print more output',
      count: true
    })
    .version(`${packageJson.name} ${packageJson.version}`)
    .alias('version', 'V')
    .strict();
  parseYargs(yargs, args, (err, argOpts, output) => {
    if (err) {
      if (output) {
        options.stderr.write(`${output}\n`);
      } else {
        options.stderr.write(`${err.name}: ${err.message}\n`);
      }
      callback(null, 1);
      return;
    }

    if (output) {
      options.stdout.write(`${output}\n`);
    }

    if (argOpts.help || argOpts.version) {
      callback(0);
      return;
    }

    if (argOpts._.length !== 1) {
      options.stderr.write('Error: Exactly one argument is required.\n');
      callback(1);
      return;
    }

    // Parse arguments then call API function with parsed options
    const cmdOpts = {
      files: argOpts._,
      verbosity: argOpts.verbose - argOpts.quiet
    };
    modulename(cmdOpts, callback);
  });
}

modulenameCmd.default = modulenameCmd;
module.exports = modulenameCmd;

if (require.main === module) {
  // This file was invoked directly.
  // Note:  Could pass process.exit as callback to force immediate exit.
  modulenameCmd(process.argv, process, (exitCode) => {
    process.exitCode = exitCode;
  });
}
