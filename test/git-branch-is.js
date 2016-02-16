/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */
'use strict';

var gitBranchIs = require('..');

var BBPromise = require('bluebird').Promise;
var PPromise = typeof Promise === 'function' ? Promise : BBPromise;
var assert = require('assert');
var path = require('path');

/** Name of the current branch. */
var BRANCH_CURRENT = 'master';
/** Name of a branch which does not exist. */
var BRANCH_NON_EXISTENT = 'non-existent';
/** Name of a branch on the same commit as the current branch. */
var BRANCH_SAME_COMMIT = 'same-commit';
/** Name of a subdirectory to create within the git repo. */
var SUBDIR_NAME = 'subdir';

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

  it('can specify git executable', function(done) {
    var altGitPath = path.join('..', 'test-bin', 'echo-surprise.js');
    gitBranchIs('surprise', {gitPath: altGitPath}, function(err, result) {
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
      gitPath: path.join('..', '..', 'test-bin', 'echo-surprise.js')
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
        hadPromise = global.hasOwnProperty('Promise');
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
      assert(promise instanceof Promise);
      return promise.then(function(result) {
        assert.strictEqual(result, true);
      });
    });

    it('Promise resolves false for different branch name', function() {
      var promise = gitBranchIs('invalid');
      assert(promise instanceof Promise);
      return promise.then(function(result) {
        assert.strictEqual(result, false);
      });
    });

    it('Promise rejects on Error', function() {
      var promise = gitBranchIs(BRANCH_CURRENT, 'opts');
      assert(promise instanceof Promise);
      return promise.then(
          function(result) { throw new Error('expecting Error'); },
          function(err) {
            assert(err instanceof TypeError);
            assert(/\boptions\b/.test(err.message));
          }
      );
    });

    describe('.getBranch()', function() {
      it('resolves to the branch name', function() {
        var promise = gitBranchIs.getBranch();
        assert(promise instanceof Promise);
        return promise.then(function(result) {
          assert.strictEqual(result, BRANCH_CURRENT);
        });
      });

      it('rejects on Error', function() {
        var promise = gitBranchIs.getBranch(BRANCH_CURRENT);
        assert(promise instanceof Promise);
        return promise.then(
          function(result) { throw new Error('expecting Error'); },
          function(err) {
            assert(err instanceof TypeError);
            assert(/\boptions\b/.test(err.message));
          }
        );
      });
    });
  });

  describe('without global Promise', function() {
    var hadPromise, oldPromise;

    before('remove global Promise', function() {
      if (global.Promise) {
        hadPromise = global.hasOwnProperty('Promise');
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
