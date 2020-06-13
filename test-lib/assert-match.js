/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const assert = require('assert').ok;

/** Asserts that a value matches a regular expression.
 *
 * @param {string} value String to be tested.
 * @param {!RegExp} regexp Regular expression to be matched.
 * @param {string=} message Message of <code>AssertionError</code> if thrown.
 * (default: '${JSON.stringify(value)} does not match ${regexp}')
 */
function assertMatch(value, regexp, message) {
  value = String(value);
  assert(
    regexp.test(value),
    message || `${JSON.stringify(value)} does not match ${regexp}`,
  );
}

module.exports = assertMatch;
