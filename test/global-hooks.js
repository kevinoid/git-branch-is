/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

// Local copy of shared constants
const {
  TEST_REPO_PATH,
} = require('../test-lib/constants');

// Global variables
let origCWD;

before('run from test repository', () => {
  origCWD = process.cwd();
  process.chdir(TEST_REPO_PATH);
});

after('restore original working directory', () => {
  process.chdir(origCWD);
});
