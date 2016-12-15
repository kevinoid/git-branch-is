/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

var gitBranchIsCmd = require('../bin/git-branch-is');

var BBPromise = require('bluebird').Promise;
// eslint-disable-next-line no-undef
var PPromise = typeof Promise === 'function' ? Promise : BBPromise;
var assert = require('assert');
var assertMatch = require('../test-lib/assert-match');
var constants = require('../test-lib/constants');
var execFile = require('child_process').execFile;
var path = require('path');

/** Initial command arguments. */
var ARGS = [process.argv[0], 'git-branch-is'];

// Local copy of shared constants
var BRANCH_CURRENT = constants.BRANCH_CURRENT;
var SUBDIR_NAME = constants.SUBDIR_NAME;
var TEST_REPO_PATH = constants.TEST_REPO_PATH;

var BRANCH_CURRENT_RE = new RegExp('\\b' + constants.BRANCH_CURRENT + '\\b');

describe('git-branch-is', function() {
  it('exit code 0 silently for same branch name', function(done) {
    gitBranchIsCmd(ARGS.concat(BRANCH_CURRENT), function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('exit code 1 with warning for different branch name', function(done) {
    gitBranchIsCmd(ARGS.concat('invalid'), function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result.code, 1);
      assert(!result.stdout);
      assertMatch(result.stderr, /\binvalid\b/);
      assertMatch(result.stderr, BRANCH_CURRENT_RE);
      done();
    });
  });

  it('exit code 1 silently with quiet option', function(done) {
    var args = ARGS.concat('-q', 'invalid');
    gitBranchIsCmd(args, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result.code, 1);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('exit code 0 with message if verbose', function(done) {
    var args = ARGS.concat('-v', BRANCH_CURRENT);
    gitBranchIsCmd(args, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assertMatch(result.stdout, BRANCH_CURRENT_RE);
      assert(!result.stderr);
      done();
    });
  });

  // Note:  This is one of the few errors that doesn't call process.exit
  it('callback Error for multiple args', function(done) {
    gitBranchIsCmd(ARGS.concat(BRANCH_CURRENT, 'foo'), function(err, result) {
      assert(err instanceof Error);
      assertMatch(err.message, /\bargument/i);
      assertMatch(err.message, /\busage/i);
      done();
    });
  });

  it('can specify an additional git argument', function(done) {
    var args = ARGS.concat(
        '-C',
        SUBDIR_NAME,
        '--git-arg=--git-dir=../.git',
        BRANCH_CURRENT
    );
    gitBranchIsCmd(args, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('can specify multiple additional git arguments', function(done) {
    var args = ARGS.concat(
        '-C',
        '..',
        '--git-arg=-C',
        '--git-arg=' + TEST_REPO_PATH,
        BRANCH_CURRENT
    );
    gitBranchIsCmd(args, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('can specify an additional git arguments separately', function(done) {
    var args = ARGS.concat(
        '--git-arg',
        '-C',
        '--git-arg',
        TEST_REPO_PATH,
        '-C',
        '..',
        BRANCH_CURRENT
    );
    gitBranchIsCmd(args, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('gitArgs takes precedence over gitDir', function(done) {
    var args = ARGS.concat(
        '--git-arg',
        // Note:  Also tests that Commander interprets this as option argument
        '--git-dir=.git',
        '--git-dir=invalid',
        BRANCH_CURRENT
    );
    gitBranchIsCmd(args, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('can specify git executable and args', function(done) {
    var gitArg = path.join('..', '..', 'test-bin', 'echo-surprise.js');
    var args = ARGS.concat(
        '-C',
        SUBDIR_NAME,
        '--git-arg=' + gitArg,
        '--git-path=' + process.execPath,
        'surprise'
    );
    gitBranchIsCmd(args, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  // Just like git -C and --git-dir
  it('gitDir is relative to cwd', function(done) {
    var args = ARGS.concat(
        '-C',
        SUBDIR_NAME,
        '--git-dir=' + path.join('..', '.git'),
        BRANCH_CURRENT
    );
    gitBranchIsCmd(args, function(err, result) {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
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

    it('returns a Promise with the result', function() {
      var promise = gitBranchIsCmd(ARGS.concat(BRANCH_CURRENT));
      assert(promise instanceof global.Promise);
      return promise.then(function(result) {
        assert.strictEqual(result.code, 0);
        assert(!result.stdout);
        assert(!result.stderr);
      });
    });

    it('rejects the Promise with an Error', function() {
      var promise = gitBranchIsCmd(ARGS.concat(
        '-C',
        'invalid',
        BRANCH_CURRENT
      ));
      assert(promise instanceof global.Promise);
      return promise.then(
        function(result) { throw new Error('expecting Error'); },
        function(err) { assert(err instanceof Error); }
      );
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
            gitBranchIsCmd(ARGS.concat(BRANCH_CURRENT));
          },
          function(err) {
            return err instanceof TypeError &&
                /\bcallback\b/.test(err.message);
          }
      );
    });
  });

  it('exit code 0 works when executed', function(done) {
    execFile(
      process.execPath,
      ['../bin/git-branch-is', BRANCH_CURRENT],
      function(err, result) {
        assert.ifError(err);
        assert(!result.stdout);
        assert(!result.stderr);
        done();
      }
    );
  });

  it('exit code 1 works when executed', function(done) {
    execFile(
      process.execPath,
      ['../bin/git-branch-is', 'invalid'],
      function(err, result) {
        assert(err instanceof Error);
        assert.strictEqual(err.code, 1);
        assertMatch(err.message, /\binvalid\b/);
        assertMatch(err.message, BRANCH_CURRENT_RE);
        done();
      }
    );
  });
});
