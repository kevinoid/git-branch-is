/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const path = require('path');

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
  /** Path to repository in which tests are run. */
  TEST_REPO_PATH: path.join(__dirname, '..', 'test-repo')
});
