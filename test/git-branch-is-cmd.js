/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const assert = require('node:assert');
const { execFile } = require('node:child_process');
const path = require('node:path');

const escapeStringRegexp = require('escape-string-regexp');

const gitBranchIsCmd = require('../bin/git-branch-is.js');
const assertMatch = require('../test-lib/assert-match.js');
const constants = require('../test-lib/constants.js');

const isWindows = /^win/i.test(process.platform);

/** Gets a RegExp which matches a given branch name in git-branch-is output.
 *
 * @private
 */
function getBranchRE(branchName) {
  return new RegExp(`"${escapeStringRegexp(branchName)}"`);
}

/** Initial command arguments. */
const ARGS = [process.argv[0], 'git-branch-is'];
const GIT_BRANCH_IS = path.join(__dirname, '..', 'bin', 'git-branch-is.js');

// Local copy of shared constants
const {
  BRANCH_CURRENT,
  SUBDIR_NAME,
  SURPRISE_BIN,
  TEST_REPO_BRANCH_PATH,
  TEST_REPO_DETACHED_PATH,
} = constants;

const BRANCH_CURRENT_RE = getBranchRE(BRANCH_CURRENT);
const OTHER_BRANCH = 'otherbranch';
const OTHER_BRANCH_RE = getBranchRE(OTHER_BRANCH);

function describeWithBranch(branchName, repoDir) {
  const branchRE = getBranchRE(branchName);
  const repoArgs = [...ARGS, '-C', repoDir];

  it('exit code 0 silently for same branch name', (done) => {
    gitBranchIsCmd([...repoArgs, branchName], (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  it('exit code 1 with warning for different branch name', (done) => {
    gitBranchIsCmd([...repoArgs, OTHER_BRANCH], (err, result) => {
      assert.ifError(err);
      assertMatch(result.stderr, OTHER_BRANCH_RE);
      assertMatch(result.stderr, branchRE);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 1);
      done();
    });
  });

  if (branchName) {
    it('exit code 1 with warning for different case branch name', (done) => {
      const branchUpper = branchName.toUpperCase();
      gitBranchIsCmd([...repoArgs, branchUpper], (err, result) => {
        assert.ifError(err);
        const branchUpperRE = new RegExp(`\\b${branchUpper}\\b`);
        assertMatch(result.stderr, branchUpperRE);
        assertMatch(result.stderr, branchRE);
        assert.strictEqual(result.stdout, null);
        assert.strictEqual(result.code, 1);
        done();
      });
    });
  }

  it('exit code 0 silently for case-insensitive branch name', (done) => {
    const args = [...repoArgs, '-i', branchName.toUpperCase()];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  it('exit code 0 silently for inverted different branch name', (done) => {
    const args = [...repoArgs, '-I', OTHER_BRANCH];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.stderr, undefined);
      done();
    });
  });

  it('exit code 1 with warning for inverted same branch name', (done) => {
    const args = [...repoArgs, '-I', branchName];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assertMatch(result.stderr, branchRE);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 1);
      done();
    });
  });

  it('exit 0 silently for matching anchored regex branch name', (done) => {
    const args = [...repoArgs, '-r', `^${branchName}$`];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  it('exit 0 silently for matching substr regex branch name', (done) => {
    const args = [...repoArgs, '-r', branchName.slice(1, -1)];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  it('exit 0 silently for matching empty regex branch name', (done) => {
    const args = [...repoArgs, '-r', ''];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  it('exit 0 silently for matching i regex branch name', (done) => {
    const args =
      [...repoArgs, '-i', '-r', `^${branchName.toUpperCase()}$`];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  it('exit 1 with warning for non-match regex branch name', (done) => {
    gitBranchIsCmd([...repoArgs, '-r', OTHER_BRANCH], (err, result) => {
      assert.ifError(err);
      assertMatch(result.stderr, OTHER_BRANCH_RE);
      assertMatch(result.stderr, branchRE);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 1);
      done();
    });
  });

  if (branchName) {
    it('exit 1 with warning for no-match case regex branch name', (done) => {
      const branchUpper = branchName.toUpperCase();
      gitBranchIsCmd([...repoArgs, '-r', branchUpper], (err, result) => {
        assert.ifError(err);
        const branchUpperRE = getBranchRE(branchUpper);
        assertMatch(result.stderr, branchUpperRE);
        assertMatch(result.stderr, branchRE);
        assert.strictEqual(result.stdout, null);
        assert.strictEqual(result.code, 1);
        done();
      });
    });
  }

  it('exit 0 silently for inverted not matching regex branch name', (done) => {
    const args = [...repoArgs, '-I', '-r', OTHER_BRANCH];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  it('exit 1 with warning for inverted match regex branch name', (done) => {
    const args = [...repoArgs, '-I', '-r', `^${branchName}$`];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assertMatch(result.stderr, branchRE);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 1);
      done();
    });
  });

  it('exit code 1 silently with quiet option', (done) => {
    const args = [...repoArgs, '-q', OTHER_BRANCH];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 1);
      done();
    });
  });

  it('exit code 0 with message if verbose', (done) => {
    const args = [...repoArgs, '-v', branchName];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assertMatch(result.stdout, branchRE);
      assert.strictEqual(result.code, 0);
      done();
    });
  });
}

describe('git-branch-is', function() {
  // Process creation (and git specifically) can be slow on Windows.
  // Particularly in Windows CI environments.  Increase timeout.
  if (isWindows) {
    this.timeout(4000);
  }

  describe('when on branch', () => {
    describeWithBranch(BRANCH_CURRENT, TEST_REPO_BRANCH_PATH);
  });

  describe('when detached', () => {
    describeWithBranch('', TEST_REPO_DETACHED_PATH);
  });

  it('exit 2 with warning for invalid regex', (done) => {
    gitBranchIsCmd([...ARGS, '-r', 'b[ad'], (err, result) => {
      assert.ifError(err);
      assertMatch(result.stderr, /\bb\[ad\b/);
      assert.strictEqual(result.stdout, undefined);
      assert.strictEqual(result.code, 2);
      done();
    });
  });

  // --quiet does not suppress notification of caller errors
  // If this behavior is desired, consider using repeated -q option.
  it('exit 2 with warning for invalid regex with quiet', (done) => {
    gitBranchIsCmd([...ARGS, '-q', '-r', 'b[ad'], (err, result) => {
      assert.ifError(err);
      assertMatch(result.stderr, /\bb\[ad\b/);
      assert.strictEqual(result.stdout, undefined);
      assert.strictEqual(result.code, 2);
      done();
    });
  });

  // Note:  This is one of the few errors that doesn't call process.exit
  it('callback Error for multiple args', (done) => {
    gitBranchIsCmd([...ARGS, BRANCH_CURRENT, 'foo'], (err, result) => {
      assert(err instanceof Error);
      assertMatch(err.message, /\bargument/i);
      assertMatch(err.message, /\busage/i);
      done();
    });
  });

  it('can specify an additional git argument', (done) => {
    const args = [
      ...ARGS,
      '-C',
      SUBDIR_NAME,
      '--git-arg=--git-dir=../.git',
      BRANCH_CURRENT,
    ];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  it('can specify multiple additional git arguments', (done) => {
    const args = [
      ...ARGS,
      '-C',
      '..',
      '--git-arg=-C',
      `--git-arg=${TEST_REPO_BRANCH_PATH}`,
      BRANCH_CURRENT,
    ];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  it('can specify an additional git arguments separately', (done) => {
    const args = [
      ...ARGS,
      '--git-arg',
      '-C',
      '--git-arg',
      TEST_REPO_BRANCH_PATH,
      '-C',
      '..',
      BRANCH_CURRENT,
    ];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  it('gitArgs takes precedence over gitDir', (done) => {
    const args = [
      ...ARGS,
      '--git-arg',
      '--git-dir=.git',
      '--git-dir=invalid',
      BRANCH_CURRENT,
    ];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  it('can specify git executable and args', (done) => {
    // Ensure git-path is treated as being relative to -C
    const gitArg = path.relative(SUBDIR_NAME, SURPRISE_BIN);
    const args = [
      ...ARGS,
      '-C',
      SUBDIR_NAME,
      `--git-arg=${gitArg}`,
      `--git-path=${process.execPath}`,
      'surprise',
    ];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  // Just like git -C and --git-dir
  it('gitDir is relative to cwd', (done) => {
    const args = [
      ...ARGS,
      '-C',
      SUBDIR_NAME,
      `--git-dir=${path.join('..', '.git')}`,
      BRANCH_CURRENT,
    ];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  // Unlike an commands with expression arguments (e.g. find, test), follow
  // the convention that repeated flag arguments are ignored.
  it('does not double-invert', (done) => {
    const args = [...ARGS, '-I', '-I', OTHER_BRANCH];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  it('support --not as alias for -I', (done) => {
    const args = [...ARGS, '--not', OTHER_BRANCH];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  // Careful that alias isn't handled differently
  it('does not double-invert with alias', (done) => {
    const args = [...ARGS, '-I', '--not', OTHER_BRANCH];
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
      done();
    });
  });

  it('returns a Promise with the result', () => {
    const promise = gitBranchIsCmd([...ARGS, BRANCH_CURRENT]);
    assert(promise instanceof globalThis.Promise);
    return promise.then((result) => {
      assert.strictEqual(result.stderr, undefined);
      assert.strictEqual(result.stdout, null);
      assert.strictEqual(result.code, 0);
    });
  });

  it('rejects the Promise with an Error', () => {
    const promise = gitBranchIsCmd(
      [...ARGS, '-C', OTHER_BRANCH, BRANCH_CURRENT],
    );
    assert(promise instanceof globalThis.Promise);
    return promise.then(
      (result) => { throw new Error('expecting Error'); },
      (err) => { assert(err instanceof Error); },
    );
  });

  describe('without global Promise', () => {
    let hadPromise, oldPromise;

    before('remove global Promise', () => {
      hadPromise = Object.hasOwn(globalThis, 'Promise');
      oldPromise = globalThis.Promise;
      // Note:  Deleting triggers Mocha's global leak detection.
      // Also wouldn't work if global scope had a prototype chain.
      globalThis.Promise = undefined;
    });

    after('restore global Promise', () => {
      if (oldPromise) {
        if (hadPromise) {
          globalThis.Promise = oldPromise;
        } else {
          delete globalThis.Promise;
        }
      }
    });

    it('throws without a callback', () => {
      assert.throws(
        () => gitBranchIsCmd([...ARGS, BRANCH_CURRENT]),
        (err) => err instanceof TypeError
                && /\bcallback\b/.test(err.message),
      );
    });
  });

  it('exit code 0 works when executed', (done) => {
    execFile(
      process.execPath,
      [GIT_BRANCH_IS, '-v', BRANCH_CURRENT],
      (err, stdout, stderr) => {
        assert.ifError(err);
        assertMatch(stdout, BRANCH_CURRENT_RE);
        assert.strictEqual(stderr, '');
        done();
      },
    );
  });

  it('exit code 1 works when executed', (done) => {
    execFile(
      process.execPath,
      [GIT_BRANCH_IS, OTHER_BRANCH],
      (err, stdout, stderr) => {
        assert(err instanceof Error);
        assertMatch(stderr, BRANCH_CURRENT_RE);
        assertMatch(stderr, OTHER_BRANCH_RE);
        assert.strictEqual(err.code, 1);
        done();
      },
    );
  });

  it('exit code 1 with extra args works when executed', (done) => {
    execFile(
      process.execPath,
      [GIT_BRANCH_IS, OTHER_BRANCH, 'extra arg'],
      (err, stdout, stderr) => {
        assert(err instanceof Error);
        assertMatch(stderr, /\bargument/);
        assert.strictEqual(stdout, '');
        assert.strictEqual(err.code, 1);
        done();
      },
    );
  });
});
