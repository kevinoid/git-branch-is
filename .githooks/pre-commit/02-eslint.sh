#!/bin/sh
# Run ESLint on changed .js and .jsx files

set -Ceu

# Run ESLint on added/modified JS files
# Use -z to \0-separate and prevent quoting of special chars in filenames
# Use tr+grep+tr to filter newline separated (could use --null-data for GNU)
git diff -z --cached --name-only --diff-filter=AM |
	tr '\n\0' '\0\n' |
	grep -a '\.jsx\?$' |
	tr '\0\n' '\n\0' |
	xargs -0r ./node_modules/.bin/eslint --
