#!/usr/bin/env node
/**
 * An NPM script which will be run from scripts in package.json.
 *
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */
'use strict';

var scriptname = {};

scriptname.main = function main(args) {
};

module.exports = scriptname;

if (require.main === module) {
  // This file was invoked directly.
  scriptname.main(process.argv).catch(function(err) {
    if (err.stderr) {
      process.stderr.write(err.stderr);
    }
    process.stderr.write(err.name + ': ' + err.message + '\n');
    process.exit(typeof err.code === 'number' ? err.code : 1);
  });
}
