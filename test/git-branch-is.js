/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

var gitBranchIs = require('..');

var BBPromise = require('bluebird').Promise;
// eslint-disable-next-line no-undef
var PPromise = typeof Promise === 'function' ? Promise : BBPromise;
var assert = require('assert');
var assertMatch = require('../test-lib/assert-match');
var constants = require('../test-lib/constants');
var path = require('path');

// Local copy of shared constants
var BRANCH_CURRENT = constants.BRANCH_CURRENT;
var BRANCH_NON_EXISTENT = constants.BRANCH_NON_EXISTENT;
var BRANCH_SAME_COMMIT = constants.BRANCH_SAME_COMMIT;
var SUBDIR_NAME = constants.SUBDIR_NAME;
var TEST_REPO_PATH = constants.TEST_REPO_PATH;

describe('gitBranchIs', function() {
  it('callback true for current branch name', function(done) {
    gitBranchIs(BRANCH_CURRENT, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('callback false for non-existent branch name', function(done) {
    gitBranchIs(BRANCH_NON_EXISTENT, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result, false);
      done();
    });
  });

  it('callback false for different branch, same commit', function(done) {
    gitBranchIs(BRANCH_SAME_COMMIT, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result, false);
      done();
    });
  });

  it('callback true for same branch name in subdir', function(done) {
    gitBranchIs(BRANCH_CURRENT, {cwd: SUBDIR_NAME}, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('callback true for function comparing branch name', function(done) {
    function checkBranchName(branchName) {
      return branchName === BRANCH_CURRENT;
    }
    gitBranchIs(checkBranchName, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('callback false for function returning false', function(done) {
    function returnsFalse(branchName) {
      return false;
    }
    gitBranchIs(returnsFalse, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result, false);
      done();
    });
  });

  it('callback propagates error from function which throws', function(done) {
    var errTest = new Error('test');
    function throwsErr(branchName) { throw errTest; }
    gitBranchIs(throwsErr, function(err, result) {
      assert.strictEqual(err, errTest);
      assert(result === undefined || result === null);
      done();
    });
  });

  it('can specify additional git arguments', function(done) {
    var options = {
      cwd: '..',
      gitArgs: ['-C', TEST_REPO_PATH]
    };
    gitBranchIs(BRANCH_CURRENT, options, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('null gitArgs is ignored', function(done) {
    gitBranchIs(BRANCH_CURRENT, {gitArgs: null}, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('gitArgs takes precedence over gitDir', function(done) {
    var options = {
      gitArgs: ['--git-dir=.git'],
      gitDir: 'invalid'
    };
    gitBranchIs(BRANCH_CURRENT, options, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('can specify git executable and args', function(done) {
    var options = {
      gitArgs: [path.join('..', 'test-bin', 'echo-surprise.js')],
      gitPath: process.execPath
    };
    gitBranchIs('surprise', options, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('callback Error outside of git repo', function(done) {
    gitBranchIs(BRANCH_CURRENT, {cwd: '/'}, function(err, result) {
      assert(err instanceof Error);
      assert(result === undefined || result === null);
      done();
    });
  });

  it('callback Error if cwd doesn\'t exist', function(done) {
    gitBranchIs(BRANCH_CURRENT, {cwd: 'invalid'}, function(err, result) {
      assert(err instanceof Error);
      assert(result === undefined || result === null);
      done();
    });
  });

  it('callback Error if git is not executable', function(done) {
    var badGitPath = path.join(__dirname, '..', 'package.json');
    gitBranchIs(BRANCH_CURRENT, {gitPath: badGitPath}, function(err, result) {
      assert(err instanceof Error);
      assert(result === undefined || result === null);
      done();
    });
  });

  it('callback Error if gitDir is not a git repo', function(done) {
    gitBranchIs(BRANCH_CURRENT, {gitDir: SUBDIR_NAME}, function(err, result) {
      assert(err instanceof Error);
      assert(result === undefined || result === null);
      done();
    });
  });

  // Just like git -C and --git-dir
  it('gitDir is relative to cwd', function(done) {
    var options = {
      cwd: SUBDIR_NAME,
      gitDir: path.join('..', '.git')
    };
    gitBranchIs(BRANCH_CURRENT, options, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  it('gitPath is relative to cwd', function(done) {
    var options = {
      cwd: SUBDIR_NAME,
      gitArgs: [path.join('..', '..', 'test-bin', 'echo-surprise.js')],
      gitPath: path.relative(SUBDIR_NAME, process.execPath)
    };
    gitBranchIs('surprise', options, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result, true);
      done();
    });
  });

  describe('.getBranch()', function() {
    it('gets the branch name', function(done) {
      gitBranchIs.getBranch(function(err, result) {
        assert.ifError(err);
        assert.strictEqual(result, BRANCH_CURRENT);
        done();
      });
    });
  });

  describe('with global Promise', function() {
    var hadPromise, oldPromise;

    before('ensure global Promise', function() {
      if (global.Promise !== PPromise) {
        hadPromise = hasOwnProperty.call(global, 'Promise');
        oldPromise = global.Promise;
        global.Promise = PPromise;
      }
    });

    after('restore global Promise', function() {
      if (hadPromise === true) {
        global.Promise = oldPromise;
      } else if (hadPromise === false) {
        delete global.Promise;
      }
    });

    it('Promise resolves true for same branch name', function() {
      var promise = gitBranchIs(BRANCH_CURRENT);
      assert(promise instanceof global.Promise);
      return promise.then(function(result) {
        assert.strictEqual(result, true);
      });
    });

    it('Promise resolves false for different branch name', function() {
      var promise = gitBranchIs('invalid');
      assert(promise instanceof global.Promise);
      return promise.then(function(result) {
        assert.strictEqual(result, false);
      });
    });

    it('Promise rejects on Error', function() {
      var promise = gitBranchIs(BRANCH_CURRENT, 'opts');
      assert(promise instanceof global.Promise);
      return promise.then(
        function(result) { throw new Error('expecting Error'); },
        function(err) {
          assert(err instanceof TypeError);
          assertMatch(err.message, /\boptions\b/);
        }
      );
    });

    it('Promise flattens for function returning Promise', function() {
      function checkBranchName(branchName) {
        return global.Promise.resolve(branchName === BRANCH_CURRENT);
      }
      var promise = gitBranchIs(checkBranchName);
      assert(promise instanceof global.Promise);
      return promise.then(function(result) {
        assert.strictEqual(result, true);
      });
    });

    it('Promise rejects for function returning Promise', function() {
      // Note: reject with non-Error to ensure no special handling
      function checkBranchName(branchName) {
        return global.Promise.reject(branchName === BRANCH_CURRENT);
      }
      var promise = gitBranchIs(checkBranchName);
      assert(promise instanceof global.Promise);
      return promise.then(
        function(result) { throw new Error('expecting rejection'); },
        function(err) {
          assert.strictEqual(err, true);
        }
      );
    });

    it('Promise rejects for function throwing Error', function() {
      var errTest = new Error('test');
      function checkBranchName(branchName) { throw errTest; }
      var promise = gitBranchIs(checkBranchName);
      assert(promise instanceof global.Promise);
      return promise.then(
        function(result) { throw new Error('expecting rejection'); },
        function(err) { assert.strictEqual(err, errTest); }
      );
    });

    describe('.getBranch()', function() {
      it('resolves to the branch name', function() {
        var promise = gitBranchIs.getBranch();
        assert(promise instanceof global.Promise);
        return promise.then(function(result) {
          assert.strictEqual(result, BRANCH_CURRENT);
        });
      });

      it('rejects on Error', function() {
        var promise = gitBranchIs.getBranch(BRANCH_CURRENT);
        assert(promise instanceof global.Promise);
        return promise.then(
          function(result) { throw new Error('expecting Error'); },
          function(err) {
            assert(err instanceof TypeError);
            assertMatch(err.message, /\boptions\b/);
          }
        );
      });
    });
  });

  describe('without global Promise', function() {
    var hadPromise, oldPromise;

    before('remove global Promise', function() {
      if (global.Promise) {
        hadPromise = hasOwnProperty.call(global, 'Promise');
        oldPromise = global.Promise;
        // Note:  Deleting triggers Mocha's global leak detection.
        // Also wouldn't work if global scope had a prototype chain.
        global.Promise = undefined;
      }
    });

    after('restore global Promise', function() {
      if (oldPromise) {
        if (hadPromise) {
          global.Promise = oldPromise;
        } else {
          delete global.Promise;
        }
      }
    });

    it('throws without a callback', function() {
      assert.throws(
        function() {
          gitBranchIs(BRANCH_CURRENT);
        },
        function(err) {
          return err instanceof TypeError &&
                /\bcallback\b/.test(err.message);
        }
      );
    });

    describe('.getBranch()', function() {
      it('throws without a callback', function() {
        assert.throws(
          function() {
            gitBranchIs.getBranch();
          },
          function(err) {
            return err instanceof TypeError &&
                  /\bcallback\b/.test(err.message);
          }
        );
      });
    });
  });
});
