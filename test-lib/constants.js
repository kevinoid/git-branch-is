/**
 * @copyright Copyright 2016-2020 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const path = require('node:path');

module.exports = Object.freeze({
  /** Name of the current branch.
   * Should not be a branch name which exists in the code repository to avoid
   * false-negatives in the tests.
   * Must not contain RegExp metachars. */
  BRANCH_CURRENT: 'test-branch',
  /** Name of a branch which does not exist. */
  BRANCH_NON_EXISTENT: 'non-existent',
  /** Name of a branch on the same commit as the current branch. */
  BRANCH_SAME_COMMIT: 'same-commit',
  /** Name of a subdirectory to create within the git repo. */
  SUBDIR_NAME: 'subdir',
  /** Path to an executable which prints "surprise" to stdout. */
  SURPRISE_BIN: path.join(__dirname, '..', 'test-bin', 'echo-surprise.js'),
  /** Path to repository with HEAD on BRANCH_CURRENT in which tests are run.
   * Note: Update path in package.json pretest script on changes.
   */
  TEST_REPO_BRANCH_PATH: path.join(__dirname, '..', 'test-repos', 'branch'),
  /** Path to repository with detached HEAD in which tests are run.
   * Note: Update path in package.json pretest script on changes.
   */
  TEST_REPO_DETACHED_PATH: path.join(__dirname, '..', 'test-repos', 'detached'),
});
