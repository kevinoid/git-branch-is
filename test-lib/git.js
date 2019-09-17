/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const { execFile } = require('child_process');
const util = require('util');

const execFileP = util.promisify(execFile);

/**
 * Run git with given arguments and options.
 * @param {...string} args Arguments to pass to git.
 * @return {Promise} Promise with the process output or Error for non-0 exit.
 */
function git(...args) {
  // Ignore stdin to prevent hanging on unexpected prompts.
  // Inherit stdout/stderr to include any output with test output.
  const stdio = ['ignore', 'inherit', 'inherit'];
  // Note: To return stderr or ChildProcess, consider using get-exec-file
  return execFileP('git', args, { stdio });
}

module.exports = git;
