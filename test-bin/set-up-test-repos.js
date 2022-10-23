/**
 * Set up git repositories for testing.
 *
 * @copyright Copyright 2016-2020 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const { mkdir, rm } = require('fs/promises');
const path = require('path');

const git = require('../test-lib/git.js');
const constants = require('../test-lib/constants.js');

// Local copy of shared constants
const {
  BRANCH_CURRENT,
  BRANCH_SAME_COMMIT,
  SUBDIR_NAME,
  TEST_REPO_BRANCH_PATH,
  TEST_REPO_DETACHED_PATH,
} = constants;

function initRepo(repoPath) {
  return rm(repoPath, { force: true, recursive: true })
    .then(() => git('init', '-q', repoPath))
    // The user name and email must be configured for the later git commands
    // to work.  On Travis CI (and probably others) there is no global config
    .then(() => git(
      '-C',
      repoPath,
      'config',
      'user.name',
      'Test User',
    ))
    .then(() => git(
      '-C',
      repoPath,
      'config',
      'user.email',
      'test@example.com',
    ))
    .then(() => git(
      '-C',
      repoPath,
      'commit',
      '-q',
      '-m',
      'Initial Commit',
      '--allow-empty',
    ));
}

function setUpBranchRepo(repoPath) {
  return initRepo(repoPath)
    .then(() => git('-C', repoPath, 'branch', '-m', BRANCH_CURRENT))
    .then(() => git('-C', repoPath, 'branch', BRANCH_SAME_COMMIT))
    .then(() => mkdir(path.join(repoPath, SUBDIR_NAME)));
}

function setUpDetachedRepo(repoPath) {
  return initRepo(repoPath)
    .then(() => git('-C', repoPath, 'checkout', '--detach'))
    .then(() => mkdir(path.join(repoPath, SUBDIR_NAME)));
}

module.exports =
function setUpTestRepos(args, options, callback) {
  if (args.length > 2) {
    options.stderr.write('Error: No arguments expected.\n');
    callback(1);
    return;
  }

  // eslint-disable-next-line promise/catch-or-return
  Promise.all([
    setUpBranchRepo(TEST_REPO_BRANCH_PATH),
    setUpDetachedRepo(TEST_REPO_DETACHED_PATH),
  ])
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
