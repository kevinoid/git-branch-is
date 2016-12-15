/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

var BBPromise = require('bluebird').Promise;
// eslint-disable-next-line no-undef
var PPromise = typeof Promise === 'function' ? Promise : BBPromise;
var constants = require('../test-lib/constants');
var fs = require('fs');
var git = require('../test-lib/git');
var path = require('path');
var pify = require('pify');
var rimraf = require('rimraf');

var fsP = pify(fs, PPromise);
var rimrafP = pify(rimraf, PPromise);

// Local copy of shared constants
var BRANCH_CURRENT = constants.BRANCH_CURRENT;
var BRANCH_SAME_COMMIT = constants.BRANCH_SAME_COMMIT;
var SUBDIR_NAME = constants.SUBDIR_NAME;
var TEST_REPO_PATH = constants.TEST_REPO_PATH;

// Global variables
var origCWD;


before('setup test repository', function() {
  return rimrafP(TEST_REPO_PATH)
    .then(function createTestRepo() {
      return git('init', '-q', TEST_REPO_PATH);
    })
    // The user name and email must be configured for the later git commands
    // to work.  On Travis CI (and probably others) there is no global config
    .then(function getConfigName() {
      return git('-C', TEST_REPO_PATH,
          'config', 'user.name', 'Test User');
    })
    .then(function getConfigEmail() {
      return git('-C', TEST_REPO_PATH,
          'config', 'user.email', 'test@example.com');
    })
    .then(function createCommit() {
      return git('-C', TEST_REPO_PATH,
          'commit', '-q', '-m', 'Initial Commit', '--allow-empty');
    })
    .then(function renameMaster() {
      return git('-C', TEST_REPO_PATH, 'branch', '-m', BRANCH_CURRENT);
    })
    .then(function makeBranch() {
      return git('-C', TEST_REPO_PATH, 'branch', BRANCH_SAME_COMMIT);
    })
    .then(function makeSubdir() {
      return fsP.mkdir(path.join(TEST_REPO_PATH, SUBDIR_NAME));
    });
});

after('remove test repository', function() {
  return rimrafP(TEST_REPO_PATH);
});

before('run from test repository', function() {
  origCWD = process.cwd();
  process.chdir(TEST_REPO_PATH);
});

after('restore original working directory', function() {
  process.chdir(origCWD);
});
