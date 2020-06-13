#!/usr/bin/env node
/**
 * Set up a git repository for testing.
 *
 * @copyright Copyright 2016-2020 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const util = require('util');

const git = require('../test-lib/git');
const constants = require('../test-lib/constants');

const mkdirP = util.promisify(fs.mkdir);
const rimrafP = util.promisify(rimraf);

// Local copy of shared constants
const {
  BRANCH_CURRENT,
  BRANCH_SAME_COMMIT,
  SUBDIR_NAME,
  TEST_REPO_PATH,
} = constants;

module.exports =
function setUpTestRepo(args, options, callback) {
  if (args.length > 2) {
    options.stderr.write('Error: No arguments expected.\n');
    callback(1);
    return;
  }

  // eslint-disable-next-line promise/catch-or-return
  rimrafP(TEST_REPO_PATH)
    .then(() => git('init', '-q', TEST_REPO_PATH))
    // The user name and email must be configured for the later git commands
    // to work.  On Travis CI (and probably others) there is no global config
    .then(() => git(
      '-C', TEST_REPO_PATH,
      'config', 'user.name', 'Test User',
    ))
    .then(() => git(
      '-C', TEST_REPO_PATH,
      'config', 'user.email', 'test@example.com',
    ))
    .then(() => git(
      '-C', TEST_REPO_PATH,
      'commit', '-q', '-m', 'Initial Commit', '--allow-empty',
    ))
    .then(() => git('-C', TEST_REPO_PATH, 'branch', '-m', BRANCH_CURRENT))
    .then(() => git('-C', TEST_REPO_PATH, 'branch', BRANCH_SAME_COMMIT))
    .then(() => mkdirP(path.join(TEST_REPO_PATH, SUBDIR_NAME)))
    /* eslint-disable promise/no-callback-in-promise */
    .then(
      () => callback(0),
      (err) => {
        options.stderr.write(`Unhandled Exception: ${err.stack}\n`);
        callback(1);
      },
    );
};

if (require.main === module) {
  // This file was invoked directly.
  // Note:  Could pass process.exit as callback to force immediate exit.
  module.exports(process.argv, process, (exitCode) => {
    process.exitCode = exitCode;
  });
}