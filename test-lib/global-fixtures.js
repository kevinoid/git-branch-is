/**
 * Set up and tear down git repositories for testing.
 *
 * @copyright Copyright 2016-2026 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const { mkdir, rm } = require('node:fs/promises');
const path = require('node:path');

const constants = require('./constants.js');
const git = require('./git.js');

// Local copy of shared constants
const {
  BRANCH_CURRENT,
  BRANCH_SAME_COMMIT,
  SUBDIR_NAME,
  TEST_REPO_PATH,
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

exports.mochaGlobalSetup = async function mochaGlobalSetup() {
  return Promise.all([
    setUpBranchRepo(TEST_REPO_BRANCH_PATH),
    setUpDetachedRepo(TEST_REPO_DETACHED_PATH),
  ]);
};

exports.mochaGlobalTeardown = async function mochaGlobalTeardown() {
  return rm(TEST_REPO_PATH, { force: true, recursive: true });
};
