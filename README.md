`git-branch-is`
===============

[![Build status](https://img.shields.io/travis/kevinoid/git-branch-is.svg?style=flat)](https://travis-ci.org/kevinoid/git-branch-is)
[![Coverage](https://img.shields.io/codecov/c/github/kevinoid/git-branch-is.svg?style=flat)](https://codecov.io/github/kevinoid/git-branch-is?branch=master)
[![Dependency Status](https://img.shields.io/david/kevinoid/git-branch-is.svg?style=flat)](https://david-dm.org/kevinoid/git-branch-is)
[![Supported Node Version](https://img.shields.io/node/v/git-branch-is.svg?style=flat)](https://www.npmjs.com/package/git-branch-is)
[![Version on NPM](https://img.shields.io/npm/v/git-branch-is.svg?style=flat)](https://www.npmjs.com/package/git-branch-is)

Assert that the name of the current branch of a git repository has a particular value.

## Introductory Example

To check that the current branch is named `release` and print an error if not,
run the following command:

```
$ git-branch-is release
Error: Current branch is "master", not "release".
$ echo $?
1
```

This can be useful as part of a [`preversion`
script](https://docs.npmjs.com/cli/version) in `package.json`:

```json
{
  "name": "super-cool-package",
  "version": "1.2.3",
  "scripts": {
    "preversion": "git-branch-is release && echo Preversion checks passed."
  }
}
```

## Installation

[This package](https://www.npmjs.com/package/browserify) can be installed
using [npm](https://www.npmjs.com/), either globally or locally, by running:

```sh
npm install git-branch-is
```

## Command Usage

The command options are intended to be similar to `git` and are documented in
the `--help` output:

    Usage: git-branch-is [options] <branch name>

    Options:

      -h, --help         output usage information
      -C <path>          run as if started in <path>
      --git-dir <dir>    set the path to the repository
      --git-path <path>  set the path to the git binary
      -q, --quiet        suppress warning message if branch differs
      -v, --verbose      print a message if the branch matches
      -V, --version      output the version number

## API Usage

To use the API with a callback function:

```js
var gitBranchIs = require('git-branch-is');
gitBranchIs('master', function(err, result) {
  if (err) console.error(err);
  else console.log(result ? 'On master' : 'Not on master');
});
```

Alternatively, if a callback is not provided, `gitBranchIs` will return a
`Promise`:

```js
var gitBranchIs = require('git-branch-is');
gitBranchIs('master').then(
  function(result) { console.log(result ? 'On master' : 'Not on master'); },
  function(err) { console.error(err); }
);
```

## API Docs

To use this module as a library, see the [API
Documentation](https://kevinoid.github.io/git-branch-is/api).

## Rationale

What's the value of this command over scripting with `git` directly?  Good
question.  The [Introductory Example](#introductory-example) could instead be
approximated with the following:

```json
{
  "name": "super-cool-package",
  "version": "1.2.3",
  "scripts": {
    "preversion": "if [ \"$(git symbolic-ref HEAD)\" = release ] ; then echo Preversion checks passed. ; else echo Error: Not on branch release. ; exit 1 ; fi"
  }
}
```

For packages which are only targeting POSIX systems, this may be a preferable
solution.  However, it doesn't work on systems which don't support the POSIX
shell language (e.g. Windows, which runs scripts in `cmd.exe`).  To support
these systems it is necessary to either introduce a dependency on Bash, to
use this script, or code up something else.

## License

This package is available under the terms of the
[MIT License](https://opensource.org/licenses/MIT).
