#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

cd "$(dirname "$0")/.."

# Read the first argument, set it to "test" if not set
VARIANT="${1-test}"

export TEST="true"

# Make a build
npm run dist

if [ "$VARIANT" = "coverage" ]; then
#    npx jest test/math-json.test  --coverage
    npx jest   --coverage
elif [ "$VARIANT" = "snapshot" ]; then
#    npx jest test/math-json.test -u
    npx jest  -u
else
    npx jest test/
    # npx jest test/math-json.test
fi