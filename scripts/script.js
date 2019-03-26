#!/usr/bin/env node
/**
 * An executable script which can be run from "scripts" in package.json.
 *
 * @copyright Copyright 2016-2019 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

/** Entry point for this script.
 *
 * @param {Array<string>} args Command-line arguments.
 * @param {!CommandOptions} options Options.
 * @param {function(number)} callback Callback with exit code.
 */
function scriptname(args, options, callback) {
}

module.exports = scriptname;

if (require.main === module) {
  // This file was invoked directly.
  // Note:  Could pass process.exit as callback to force immediate exit.
  scriptname(process.argv, process, (exitCode) => {
    process.exitCode = exitCode;
  });
}
