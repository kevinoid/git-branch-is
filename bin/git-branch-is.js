#!/usr/bin/env node
/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

var Command = require('commander').Command;
var exit = require('exit');
var gitBranchIs = require('..');
var minimatch = require('minimatch');
var packageJson = require('../package.json');

function collect(arg, args) {
  args.push(arg);
  return args;
}

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
function gitBranchIsCmd(args, callback) {
  if (!callback && typeof Promise === 'function') {
    // eslint-disable-next-line no-undef
    return new Promise(function(resolve, reject) {
      gitBranchIsCmd(args, function(err, result) {
        if (err) { reject(err); } else { resolve(result); }
      });
    });
  }

  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  // TODO:  Proxy console.{error,log} and process.exit so we can return result
  var command = new Command()
    // .arguments() splits on white space.  Call .parseExpectedArgs directly.
    .parseExpectedArgs(['<branch name>'])
    .option('-C <path>', 'run as if started in <path>')
    .option(
      '--git-arg <arg>', 'additional argument to git (can be repeated)',
      collect, []
    )
    .option('--git-dir <dir>', 'set the path to the repository')
    .option('--git-path <path>', 'set the path to the git binary')
    .option('-q, --quiet', 'suppress warning message if branch differs')
    .option('-v, --verbose', 'print a message if the branch matches')
    .version(packageJson.version)
    .parse(args);

  if (command.args.length !== 1) {
    callback(new Error('Exactly one argument is required.\n' +
          command.helpInformation()));
    return undefined;
  }

  // -C option is cmd in options Object
  command.cwd = command.C;

  // pluralize --git-arg to cover multiple uses
  command.gitArgs = command.gitArg;

  var expectedBranch = command.args[0];
  gitBranchIs.getBranch(command, function(err, currentBranch) {
    if (err) {
      callback(err);
      return;
    }

    if (!minimatch(currentBranch, expectedBranch)) {
      callback(null, {
        code: 1,
        stderr: command.quiet ? '' :
          'Error: Current branch is "' + currentBranch + '", not "' +
          expectedBranch + '".\n'
      });
      return;
    }

    callback(null, {
      code: 0,
      stdout: !command.verbose ? '' :
        'Current branch is "' + currentBranch + '".\n'
    });
  });
  return undefined;
}

module.exports = gitBranchIsCmd;

if (require.main === module) {
  // This file was invoked directly.
  /* eslint-disable no-process-exit */
  gitBranchIsCmd(process.argv, function(err, result) {
    var errOrResult = err || result;
    if (errOrResult.stdout) { process.stdout.write(errOrResult.stdout); }
    if (errOrResult.stderr) { process.stderr.write(errOrResult.stderr); }
    if (err) { process.stderr.write(err.name + ': ' + err.message + '\n'); }

    var code = typeof errOrResult.code === 'number' ? errOrResult.code :
      err ? 1 : 0;
    exit(code);
  });
}
