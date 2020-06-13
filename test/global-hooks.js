/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
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

// Global variables
let origCWD;

before('setup test repository', function() {
  // Some git versions can run quite slowly on Windows (in AppVeyor)
  this.timeout(/^win/i.test(process.platform) ? 8000 : 4000);

  return rimrafP(TEST_REPO_PATH)
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
    .then(() => mkdirP(path.join(TEST_REPO_PATH, SUBDIR_NAME)));
});

before('run from test repository', () => {
  origCWD = process.cwd();
  process.chdir(TEST_REPO_PATH);
});

after('restore original working directory', () => {
  process.chdir(origCWD);
});

after('remove test repository', () => rimrafP(TEST_REPO_PATH));
