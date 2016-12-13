/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

var execFile = require('child_process').execFile;

/** Options for {@link gitBranchIs}.
 *
 * @typedef {{
 *   cwd: (?string|undefined),
 *   gitDir: (?string|undefined),
 *   gitPath: (string|undefined)
 * }}
 * @property {?string=} cwd Current working directory where the branch name is
 * tested.
 * @property {?string=} gitDir Path to the repository (i.e.
 * <code>--git-dir=</code> option to <code>git</code>).
 * @property {string=} git Git binary name or path to use (default:
 * <code>'git'</code>).
 */
var GitBranchIsOptions = {
  cwd: '',
  gitDir: '',
  gitPath: 'git'
};

/** Checks that the current branch of a git repository has a given name.
 *
 * @param {string} branchName Expected name of current branch.
 * @param {?GitBranchIsOptions=} options Options.
 * @param {?function(Error, boolean=)=} callback Callback function called
 * with <code>true</code> if the current branch is <code>branchName</code>,
 * <code>false</code> if not, <code>Error</code> if it could not be determined.
 * @return {Promise|undefined} If <code>callback</code> is not given and
 * <code>global.Promise</code> is defined, a <code>Promise</code> with
 * <code>true</code> if the current branch is <code>branchName</code>,
 * <code>false</code> if not, <code>Error</code> if it could not be determined.
 */
function gitBranchIs(branchName, options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = null;
  }

  if (!callback && typeof Promise === 'function') {
    // eslint-disable-next-line no-undef
    return new Promise(function(resolve, reject) {
      gitBranchIs(branchName, options, function(err, result) {
        if (err) { reject(err); } else { resolve(result); }
      });
    });
  }

  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  if (options && typeof options !== 'object') {
    process.nextTick(function() {
      callback(new TypeError('options must be an object'));
    });
    return undefined;
  }

  gitBranchIs.getBranch(options, function(err, currentBranch) {
    if (err) {
      callback(err);
      return;
    }

    callback(null, branchName === currentBranch);
  });
  return undefined;
}

/** Checks that the current branch of a git repository has a given name.
 *
 * @param {?GitBranchIsOptions=} options Options.
 * @param {?function(Error, string=)=} callback Callback function called
 * with the current branch name, or <code>Error</code> if it could not be
 * determined.
 * @return {Promise|undefined} If <code>callback</code> is not given and
 * <code>global.Promise</code> is defined, a <code>Promise</code> with the
 * current branch name, or <code>Error</code> if it could not be determined.
 */
gitBranchIs.getBranch = function getBranch(options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = null;
  }

  if (!callback && typeof Promise === 'function') {
    // eslint-disable-next-line no-undef
    return new Promise(function(resolve, reject) {
      getBranch(options, function(err, result) {
        if (err) { reject(err); } else { resolve(result); }
      });
    });
  }

  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  if (options && typeof options !== 'object') {
    process.nextTick(function() {
      callback(new TypeError('options must be an Object'));
    });
    return undefined;
  }

  var combinedOpts = {};
  Object.keys(GitBranchIsOptions).forEach(function(prop) {
    combinedOpts[prop] = GitBranchIsOptions[prop];
  });
  Object.keys(Object(options)).forEach(function(prop) {
    combinedOpts[prop] = options[prop];
  });

  var gitArgs = ['symbolic-ref', '--short', 'HEAD'];
  if (combinedOpts.gitDir) {
    gitArgs.unshift('--git-dir=' + combinedOpts.gitDir);
  }

  try {
    execFile(
        combinedOpts.gitPath,
        gitArgs,
        {cwd: combinedOpts.cwd},
        function(errExec, stdout, stderr) {
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
    process.nextTick(function() {
      callback(errExec);
    });
    return undefined;
  }

  return undefined;
};

module.exports = gitBranchIs;
