/**
 * @copyright Copyright 2016-2020 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const { TEST_REPO_BRANCH_PATH } = require('./constants');

// Working directory before changing to TEST_REPO_PATH
let origCWD;

exports.mochaHooks = {
  beforeAll() {
    origCWD = process.cwd();
    process.chdir(TEST_REPO_BRANCH_PATH);
  },

  afterAll() {
    process.chdir(origCWD);
  },
};
