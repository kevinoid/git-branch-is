/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const { execFile } = require('child_process');

/** Options for {@link gitBranchIs}.
 *
 * @typedef {{
 *   cwd: (?string|undefined),
 *   gitArgs: (Array|undefined),
 *   gitDir: (?string|undefined),
 *   gitPath: (string|undefined)
 * }} GitBranchIsOptions
 * @property {?string=} cwd Current working directory where the branch name is
 * tested.
 * @property {Array=} gitArgs Extra arguments to pass to git.
 * @property {?string=} gitDir Path to the repository (i.e.
 * <code>--git-dir=</code> option to <code>git</code>).
 * @property {string=} gitPath Git binary name or path to use (default:
 * <code>'git'</code>).
 */
const GitBranchIsOptions = {
  cwd: '',
  gitArgs: [],
  gitDir: '',
  gitPath: 'git',
};

/** Checks that the current branch of a git repository has a given name.
 *
 * @param {string|function(string)} branchNameOrTest Expected name of
 * current branch or a test function to apply to the branch name.
 * @param {?GitBranchIsOptions=} options Options.
 * @param {?function(Error, boolean=)=} callback Callback function called
 * with the return value of <code>branchNameOrTest</code> if it is a function,
 * or the result of identity checking <code>branchNameOrTest</code> to the
 * current branch name.
 * @returns {Promise|undefined} If <code>callback</code> is not given, a
 * <code>Promise</code> with the return value of <code>branchNameOrTest</code>
 * if it is a function, or the result of identity checking
 * <code>branchNameOrTest</code> to the current branch name.
 */
function gitBranchIs(branchNameOrTest, options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = undefined;
  }

  if (!callback) {
    return new Promise((resolve, reject) => {
      gitBranchIs(branchNameOrTest, options, (err, result) => {
        if (err) { reject(err); } else { resolve(result); }
      });
    });
  }

  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  if (options !== undefined && typeof options !== 'object') {
    process.nextTick(callback, new TypeError('options must be an object'));
    return undefined;
  }

  gitBranchIs.getBranch(options, (err, currentBranch) => {
    if (err) {
      callback(err);
      return;
    }

    let result;
    try {
      result = currentBranch === branchNameOrTest
        || (typeof branchNameOrTest === 'function'
         && branchNameOrTest(currentBranch));
    } catch (errTest) {
      callback(errTest);
      return;
    }

    callback(null, result); // eslint-disable-line unicorn/no-null
  });
  return undefined;
}

/** Gets the name of the current (i.e. checked out) branch of a git repository.
 *
 * @param {?GitBranchIsOptions=} options Options.
 * @param {?function(Error, string=)=} callback Callback function called
 * with the current branch name, empty string if not on a branch, or
 * <code>Error</code> if there was an error determining the branch name.
 * @returns {Promise|undefined} If <code>callback</code> is not given, a
 * <code>Promise</code> with the current branch name, empty string if not on a
 * branch, or <code>Error</code> if there was an error determining the branch
 * name.
 */
gitBranchIs.getBranch = function getBranch(options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = undefined;
  }

  if (!callback) {
    return new Promise((resolve, reject) => {
      getBranch(options, (err, result) => {
        if (err) { reject(err); } else { resolve(result); }
      });
    });
  }

  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  if (options && typeof options !== 'object') {
    process.nextTick(callback, new TypeError('options must be an Object'));
    return undefined;
  }

  const combinedOpts = {
    ...GitBranchIsOptions,
    ...options,
  };
  const gitArgs = combinedOpts.gitArgs
    ? Array.prototype.slice.call(combinedOpts.gitArgs, 0)
    : [];
  if (combinedOpts.gitDir) {
    gitArgs.unshift(`--git-dir=${combinedOpts.gitDir}`);
  }
  // Note: --quiet causes symbolic-ref to exit with code 1 and no error
  // instead of code 128 and "ref %s is not a symbolic ref" when not on a
  // branch.
  gitArgs.push('symbolic-ref', '--quiet', '--short', 'HEAD');

  try {
    execFile(
      combinedOpts.gitPath,
      gitArgs,
      { cwd: combinedOpts.cwd },
      (errExec, stdout, stderr) => {
        if (errExec) {
          if (errExec.code === 1 && !stdout && !stderr) {
            // Not on a branch
            callback(null, ''); // eslint-disable-line unicorn/no-null
          } else {
            callback(errExec);
          }

          return;
        }

        // Note:  ASCII space and control characters are forbidden in names
        // https://www.kernel.org/pub/software/scm/git/docs/git-check-ref-format.html
        callback(null, stdout.trimEnd()); // eslint-disable-line unicorn/no-null
      },
    );
  } catch (errExec) {
    process.nextTick(callback, errExec);
    return undefined;
  }

  return undefined;
};

module.exports = gitBranchIs;
