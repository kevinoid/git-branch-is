Release Scripts
===============

[![Build status](https://img.shields.io/travis/kevinoid/release-scripts.svg?style=flat)](https://travis-ci.org/kevinoid/release-scripts)
[![Coverage](https://img.shields.io/codecov/c/github/kevinoid/release-scripts.svg?style=flat)](https://codecov.io/github/kevinoid/release-scripts?branch=master)
[![Dependency Status](https://img.shields.io/david/kevinoid/release-scripts.svg?style=flat)](https://david-dm.org/kevinoid/release-scripts)
[![Supported Node Version](https://img.shields.io/node/v/@kevinoid/release-scripts.svg?style=flat)](https://www.npmjs.com/package/@kevinoid/release-scripts)
[![Version on NPM](https://img.shields.io/npm/v/@kevinoid/release-scripts.svg?style=flat)](https://www.npmjs.com/package/@kevinoid/release-scripts)

A collection of utility scripts for releasing npm packages designed to be
used in [npm version scripts](https://docs.npmjs.com/cli/version).

This package is currently in the `@kevinoid` scope because they are only used
by [kevinoid](https://github.com/kevinoid/)'s projects.  [Semantic
Versioning](http://semver.org) is being followed.  (Expect incompatible
changes from minor number changes before 1.0, but not from patch number
changes.)  If you are interested in using (or maintaining) this package,
please open an issue and I'll consider providing proper project management and
un-scoping the module.

## Similar Packages

Some similar packages which were considered before embarking on this project
are listed below.  Note that all of these packages provide an automated
release process (one which use `git` and `npm`), unlike this package which is
designed to be called by the [npm version
scripts](https://docs.npmjs.com/cli/version).

* [semantic-release](https://github.com/semantic-release/semantic-release) -
  Performs automatic releases after CI build with automated version changes,
  that implement semantic versioning, based on commit messages.
* [grunt-release](https://github.com/geddski/grunt-release) - Single
  Grunt-command release process.
* [Release It!](https://github.com/webpro/release-it) - Single-command
  interactive release process.
* [rf-release](https://github.com/ryanflorence/rf-release) - Single-command
  release process which tags in `git` and runs
  [rf-changelog](https://github.com/rpflorence/rf-changelog) to update a
  ChangeLog.
* [Releasor](https://github.com/kimmobrunfeldt/releasor) - Single-command
  release process which calls `git` and `npm`.
* [release-script](https://github.com/alexkval/release-script) -
  Single-command release tool with support for git status checks, changelog
  generation with [rf-changelog](https://github.com/rpflorence/rf-changelog) or
  [mt-changelog](https://github.com/mtscout6/mt-changelog), releasing with
  `bower` and `npm`, and pushing a separate documents repo.
* [eslint-release](https://github.com/eslint/eslint-release) - Single-command
  release tool used by ESLint organization projects which runs tests, creates
  a ChangeLog from git commit messages, and calls `npm version`.
* [git-release](https://github.com/oligot/git-release) - Single-command release
  process which calls `git` and `npm`.

## License

This package is available under the terms of the
[MIT License](https://opensource.org/licenses/MIT).
