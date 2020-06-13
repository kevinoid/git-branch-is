#!/usr/bin/env node
/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const { Command } = require('commander');

const gitBranchIs = require('..');
const packageJson = require('../package.json');

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

/**
 * Entry point for this command.
 *
 * @param {!Array<string>} args Command-line arguments.
 * @param {?function(Error, ?CommandResult=)=} callback Callback for the
 * command result or error.  Required if <code>global.Promise</code> is not
 * defined.
 * @returns {Promise|undefined} If <code>callback</code> is not given and
 * <code>global.Promise</code> is defined, a <code>Promise</code> which will
 * resolve on completion.
 */
function gitBranchIsCmd(args, callback) {
  if (!callback && typeof Promise === 'function') {
    return new Promise((resolve, reject) => {
      gitBranchIsCmd(args, (err, result) => {
        if (err) { reject(err); } else { resolve(result); }
      });
    });
  }

  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  // TODO:  Proxy console.{error,log} and process.exit so we can return result
  const command = new Command()
    .arguments('<branch_name>')
    .option('-C <path>', 'run as if started in <path>')
    .option(
      '--git-arg <arg>', 'additional argument to git (can be repeated)',
      collect, [],
    )
    .option('--git-dir <dir>', 'set the path to the repository')
    .option('--git-path <path>', 'set the path to the git binary')
    .option('-i, --ignore-case', 'compare/match branch_name case-insensitively')
    .option('-I, --invert-match', 'inverts/negates comparison')
    // Note:  Commander.js only supports one long option per option call
    // https://github.com/tj/commander.js/issues/430
    .option('--not', 'inverts/negates comparison (same as --invert-match)')
    .option('-q, --quiet', 'suppress warning message if branch differs')
    .option('-r, --regex', 'match branch_name as a regular expression')
    .option('-v, --verbose', 'print a message if the branch matches')
    .version(packageJson.version)
    .parse(args);

  if (command.args.length !== 1) {
    callback(new Error(`Exactly one argument is required.\n${
      command.helpInformation()}`));
    return undefined;
  }

  // -C option is cmd in options Object
  command.cwd = command.C;

  // pluralize --git-arg to cover multiple uses
  command.gitArgs = command.gitArg;

  // treat --not as an alias for --invert-match
  command.invertMatch = command.invertMatch || command.not;

  const expectedBranch = command.args[0];

  let expectedBranchRegExp;
  if (command.regex) {
    try {
      expectedBranchRegExp = new RegExp(
        expectedBranch,
        command.ignoreCase ? 'i' : undefined,
      );
    } catch (errRegExp) {
      // Benefit of avoiding unnecessary API changes outweighs style concerns
      // eslint-disable-next-line unicorn/no-null
      callback(null, {
        code: 2,
        stderr: `Error: Invalid RegExp "${expectedBranch}": ${
          errRegExp}\n`,
      });
      return undefined;
    }
  }

  gitBranchIs.getBranch(command, (err, currentBranch) => {
    if (err) {
      callback(err);
      return;
    }

    let errMsg, isMatch;
    if (expectedBranchRegExp) {
      isMatch = expectedBranchRegExp.test(currentBranch);
      if (command.invertMatch) {
        isMatch = !isMatch;
      }

      if (!isMatch && !command.quiet) {
        errMsg = command.invertMatch
          ? `Current branch "${currentBranch}" matches "${expectedBranch}".\n`
          : `Current branch "${currentBranch}" does not match "${
            expectedBranch}".\n`;
      }
    } else {
      isMatch = currentBranch === expectedBranch
        || (command.ignoreCase
            && currentBranch.toUpperCase() === expectedBranch.toUpperCase());
      if (command.invertMatch) {
        isMatch = !isMatch;
      }

      if (!isMatch && !command.quiet) {
        errMsg = command.invertMatch
          ? `Current branch is "${currentBranch}".\n`
          : `Current branch is "${currentBranch}", not "${expectedBranch}".\n`;
      }
    }

    // Benefit of avoiding unnecessary API changes outweighs style concerns
    // eslint-disable-next-line unicorn/no-null
    callback(null, {
      code: isMatch ? 0 : 1,
      stderr: errMsg && `Error: ${errMsg}`,
      stdout: isMatch && command.verbose
        ? `Current branch is "${currentBranch}".\n`
        : null, // eslint-disable-line unicorn/no-null
    });
  });
  return undefined;
}

module.exports = gitBranchIsCmd;

if (require.main === module) {
  // This file was invoked directly.
  /* eslint-disable no-process-exit */
  gitBranchIsCmd(process.argv, (err, result) => {
    const errOrResult = err || result;
    if (errOrResult.stdout) { process.stdout.write(errOrResult.stdout); }
    if (errOrResult.stderr) { process.stderr.write(errOrResult.stderr); }
    if (err) { process.stderr.write(`${err.name}: ${err.message}\n`); }

    const code = typeof errOrResult.code === 'number' ? errOrResult.code
      : err ? 1 : 0;
    process.exit(code);
  });
}
