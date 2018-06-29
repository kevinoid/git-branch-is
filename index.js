/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const {execFile} = require('child_process');

/** Options for {@link gitBranchIs}.
 *
 * @typedef {{
 *   cwd: (?string|undefined),
 *   gitArgs: (Array|undefined),
 *   gitDir: (?string|undefined),
 *   gitPath: (string|undefined)
 * }}
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
  gitPath: 'git'
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
 * @return {Promise|undefined} If <code>callback</code> is not given, a
 * <code>Promise</code> with the return value of <code>branchNameOrTest</code>
 * if it is a function, or the result of identity checking
 * <code>branchNameOrTest</code> to the current branch name.
 */
function gitBranchIs(branchNameOrTest, options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = null;
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

    callback(null, result);
  });
  return undefined;
}

/** Gets the name of the current (i.e. checked out) branch of a git repository.
 *
 * @param {?GitBranchIsOptions=} options Options.
 * @param {?function(Error, string=)=} callback Callback function called
 * with the current branch name, or <code>Error</code> if it could not be
 * determined.
 * @return {Promise|undefined} If <code>callback</code> is not given, a
 * <code>Promise</code> with the current branch name, or <code>Error</code> if
 * it could not be determined.
 */
gitBranchIs.getBranch = function getBranch(options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = null;
  }

  if (!callback) {
    return new Promise(((resolve, reject) => {
      getBranch(options, (err, result) => {
        if (err) { reject(err); } else { resolve(result); }
      });
    }));
  }

  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  if (options && typeof options !== 'object') {
    process.nextTick(callback, new TypeError('options must be an Object'));
    return undefined;
  }

  const combinedOpts = {};
  Object.keys(GitBranchIsOptions).forEach((prop) => {
    combinedOpts[prop] = GitBranchIsOptions[prop];
  });
  Object.keys(Object(options)).forEach((prop) => {
    combinedOpts[prop] = options[prop];
  });

  const gitArgs = combinedOpts.gitArgs
    ? Array.prototype.slice.call(combinedOpts.gitArgs, 0)
    : [];
  if (combinedOpts.gitDir) {
    gitArgs.unshift(`--git-dir=${combinedOpts.gitDir}`);
  }
  gitArgs.push('symbolic-ref', '--short', 'HEAD');

  try {
    execFile(
      combinedOpts.gitPath,
      gitArgs,
      {cwd: combinedOpts.cwd},
      (errExec, stdout, stderr) => {
        if (errExec) {
          callback(errExec);
          return;
        }

        // Note:  ASCII space and control characters are forbidden in names
        // https://www.kernel.org/pub/software/scm/git/docs/git-check-ref-format.html
        callback(null, stdout.trimRight());
      }
    );
  } catch (errExec) {
    process.nextTick(callback, errExec);
    return undefined;
  }

  return undefined;
};

module.exports = gitBranchIs;
