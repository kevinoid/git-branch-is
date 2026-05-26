// ESLint configuration <https://eslint.org/docs/user-guide/configuring>

'use strict';

const { default: nodejs } = require('@kevinoid/eslint-config/nodejs.js');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'coverage/',
      'doc/',
    ],
  },

  ...nodejs,

  {
    rules: {
      // Allow requiring devDependencies for build and test
      'import/no-extraneous-dependencies': ['error', {
        devDependencies: [
          ...nodejs
            .findLast(
              (conf) => conf.rules?.['import/no-extraneous-dependencies'],
            )
            .rules['import/no-extraneous-dependencies'][1].devDependencies,
          'gulpfile.js',
          'test-bin/**',
          'test-lib/**',
          'test/**',
        ],
      }],

      // Allow CommonJS modules
      'unicorn/prefer-module': 'off',

      // Don't prefer top-level await
      // Since top-level await is only supported in ECMAScript Modules (ESM)
      'unicorn/prefer-top-level-await': 'off',
    },
  },

  {
    name: 'bin config',
    files: [
      'bin/*.js',
      'test-bin/*',
    ],
    rules: {
      // Executable scripts should have a shebang
      'n/hashbang': 'off',
    },
  },

  {
    name: 'test config',
    basePath: 'test',
    languageOptions: {
      globals: globals.mocha,
    },
    rules: {
      // Allow, but don't require, braces around function body
      // Braces around body of it() function is more consistent/readable
      'arrow-body-style': 'off',

      // Allow null use in tests
      'unicorn/no-null': 'off',

      // Allow EventEmitter use in tests
      'unicorn/prefer-event-target': 'off',
    },
  },
];
