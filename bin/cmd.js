#!/usr/bin/env node
/**
 * An executable command which will be added to $PATH.
 *
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */
'use strict';

var cmdname = {};

cmdname.main = function main(args) {
};

module.exports = cmdname;

if (require.main === module) {
  // This file was invoked directly.
  /* eslint-disable no-process-exit */
  cmdname.main(process.argv).catch(function(err) {
    if (err.stderr) {
      process.stderr.write(err.stderr);
    }
    process.stderr.write(err.name + ': ' + err.message + '\n');
    process.exit(typeof err.code === 'number' ? err.code : 1);
  });
}
