/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const assert = require('assert');
const path = require('path');

const gitBranchIs = require('..');

const assertMatch = require('../test-lib/assert-match');
const constants = require('../test-lib/constants');

// Local copy of shared constants
const {
  BRANCH_CURRENT,
  BRANCH_NON_EXISTENT,
  BRANCH_SAME_COMMIT,
  SUBDIR_NAME,
  TEST_REPO_PATH
} = constants;

describe('gitBranchIs', () => {
  it('callback true for current branch name', (done) => {
    gitBranchIs(BRANCH_CURRENT, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('callback false for non-existent branch name', (done) => {
    gitBranchIs(BRANCH_NON_EXISTENT, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result, false);
      done();
    });
  });

  it('callback false for different branch, same commit', (done) => {
    gitBranchIs(BRANCH_SAME_COMMIT, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result, false);
      done();
    });
  });

  it('callback true for same branch name in subdir', (done) => {
    gitBranchIs(BRANCH_CURRENT, {cwd: SUBDIR_NAME}, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('callback true for function comparing branch name', (done) => {
    function checkBranchName(branchName) {
      return branchName === BRANCH_CURRENT;
    }
    gitBranchIs(checkBranchName, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('callback false for function returning false', (done) => {
    function returnsFalse(branchName) {
      return false;
    }
    gitBranchIs(returnsFalse, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result, false);
      done();
    });
  });

  it('callback propagates error from function which throws', (done) => {
    const errTest = new Error('test');
    function throwsErr(branchName) { throw errTest; }
    gitBranchIs(throwsErr, (err, result) => {
      assert.strictEqual(err, errTest);
      assert(result === undefined || result === null);
      done();
    });
  });

  it('can specify additional git arguments', (done) => {
    const options = {
      cwd: '..',
      gitArgs: ['-C', TEST_REPO_PATH]
    };
    gitBranchIs(BRANCH_CURRENT, options, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('null gitArgs is ignored', (done) => {
    gitBranchIs(BRANCH_CURRENT, {gitArgs: null}, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('gitArgs takes precedence over gitDir', (done) => {
    const options = {
      gitArgs: ['--git-dir=.git'],
      gitDir: 'invalid'
    };
    gitBranchIs(BRANCH_CURRENT, options, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('can specify git executable and args', (done) => {
    const options = {
      gitArgs: [path.join('..', 'test-bin', 'echo-surprise.js')],
      gitPath: process.execPath
    };
    gitBranchIs('surprise', options, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('callback Error outside of git repo', (done) => {
    gitBranchIs(BRANCH_CURRENT, {cwd: '/'}, (err, result) => {
      assert(err instanceof Error);
      assert(result === undefined || result === null);
      done();
    });
  });

  it('callback Error if cwd doesn\'t exist', (done) => {
    gitBranchIs(BRANCH_CURRENT, {cwd: 'invalid'}, (err, result) => {
      assert(err instanceof Error);
      assert(result === undefined || result === null);
      done();
    });
  });

  it('callback Error if git is not executable', (done) => {
    const badGitPath = path.join(__dirname, '..', 'package.json');
    gitBranchIs(BRANCH_CURRENT, {gitPath: badGitPath}, (err, result) => {
      assert(err instanceof Error);
      assert(result === undefined || result === null);
      done();
    });
  });

  it('callback Error if gitDir is not a git repo', (done) => {
    gitBranchIs(BRANCH_CURRENT, {gitDir: SUBDIR_NAME}, (err, result) => {
      assert(err instanceof Error);
      assert(result === undefined || result === null);
      done();
    });
  });

  // Just like git -C and --git-dir
  it('gitDir is relative to cwd', (done) => {
    const options = {
      cwd: SUBDIR_NAME,
      gitDir: path.join('..', '.git')
    };
    gitBranchIs(BRANCH_CURRENT, options, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('gitPath is relative to cwd', (done) => {
    const options = {
      cwd: SUBDIR_NAME,
      gitArgs: [path.join('..', '..', 'test-bin', 'echo-surprise.js')],
      gitPath: path.relative(SUBDIR_NAME, process.execPath)
    };
    gitBranchIs('surprise', options, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  describe('.getBranch()', () => {
    it('gets the branch name', (done) => {
      gitBranchIs.getBranch((err, result) => {
        assert.ifError(err);
        assert.strictEqual(result, BRANCH_CURRENT);
        done();
      });
    });
  });

  it('Promise resolves true for same branch name', () => {
    const promise = gitBranchIs(BRANCH_CURRENT);
    assert(promise instanceof global.Promise);
    return promise.then((result) => {
      assert.strictEqual(result, true);
    });
  });

  it('Promise resolves false for different branch name', () => {
    const promise = gitBranchIs('invalid');
    assert(promise instanceof global.Promise);
    return promise.then((result) => {
      assert.strictEqual(result, false);
    });
  });

  it('Promise rejects on Error', () => {
    const promise = gitBranchIs(BRANCH_CURRENT, 'opts');
    assert(promise instanceof global.Promise);
    return promise.then(
      (result) => { throw new Error('expecting Error'); },
      (err) => {
        assert(err instanceof TypeError);
        assertMatch(err.message, /\boptions\b/);
      }
    );
  });

  it('Promise flattens for function returning Promise', () => {
    function checkBranchName(branchName) {
      return global.Promise.resolve(branchName === BRANCH_CURRENT);
    }
    const promise = gitBranchIs(checkBranchName);
    assert(promise instanceof global.Promise);
    return promise.then((result) => {
      assert.strictEqual(result, true);
    });
  });

  it('Promise rejects for function returning Promise', () => {
    // Note: reject with non-Error to ensure no special handling
    function checkBranchName(branchName) {
      return global.Promise.reject(branchName === BRANCH_CURRENT);
    }
    const promise = gitBranchIs(checkBranchName);
    assert(promise instanceof global.Promise);
    return promise.then(
      (result) => { throw new Error('expecting rejection'); },
      (err) => {
        assert.strictEqual(err, true);
      }
    );
  });

  it('Promise rejects for function throwing Error', () => {
    const errTest = new Error('test');
    function checkBranchName(branchName) { throw errTest; }
    const promise = gitBranchIs(checkBranchName);
    assert(promise instanceof global.Promise);
    return promise.then(
      (result) => { throw new Error('expecting rejection'); },
      (err) => { assert.strictEqual(err, errTest); }
    );
  });

  describe('.getBranch()', () => {
    it('resolves to the branch name', () => {
      const promise = gitBranchIs.getBranch();
      assert(promise instanceof global.Promise);
      return promise.then((result) => {
        assert.strictEqual(result, BRANCH_CURRENT);
      });
    });

    it('rejects on Error', () => {
      const promise = gitBranchIs.getBranch(BRANCH_CURRENT);
      assert(promise instanceof global.Promise);
      return promise.then(
        (result) => { throw new Error('expecting Error'); },
        (err) => {
          assert(err instanceof TypeError);
          assertMatch(err.message, /\boptions\b/);
        }
      );
    });
  });
});
