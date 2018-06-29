/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const {execFile} = require('child_process');
const pify = require('pify');

const execFileP = pify(execFile, {multiArgs: true});

/**
 * Run git with given arguments and options.
 * @param {...string} args Arguments to pass to git.  Last argument may be an
 * options object.
 * @return {Promise} Promise with the process output or Error for non-0 exit.
 */
function git(...args) {
  // Default to redirecting stdin (to prevent unexpected prompts) and
  // including any output with test output
  const defaultStdio = ['ignore', process.stdout, process.stderr];

  let options;
  if (typeof args[args.length - 1] === 'object') {
    options = args.pop();
    options.stdio = options.stdio || defaultStdio;
  } else {
    options = {
      stdio: defaultStdio
    };
  }

  return execFileP('git', args, options);
}

module.exports = git;
