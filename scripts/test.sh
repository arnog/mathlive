#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

cd "$(dirname "$0")/.."

# Read the first argument, set it to "test" if not set
VARIANT="${1-test}"

if [ ! -d "./dist/types" ]; then
    npm run build
fi

exit_code=0


if [ "$VARIANT" = "coverage" ]; then
    printf "\033[32m 🧐 \033[0m Running Unit Test suite with coverage"
    npx jest test/  --coverage || exit_code=$?
    echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Unit test suite with coverage complete"
elif [ "$VARIANT" = "snapshot" ]; then
    printf "\033[32m 🧐 \033[0m Running Unit Test suite snapshot"
    npx jest test/ -u || exit_code=$?
    echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Unit test suite snapshot complete"
else
    printf "\033[32m 🧐 \033[0m Running Unit Test suite"
    npx jest test/ || exit_code=$?
    echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Unit test suite complete"
fi

#
# Validate that the public declaration files do not reference
# private types
#

echo -e "\n🧐 Running Declaration Type test suite..."

npx tsc --noEmit --baseUrl ./dist/types ./test/public-ts-declarations/main.ts || exit_code=$?

echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Declaration Type test suite complete"


#
# Run playwright end-to-end tests
#

echo -e "\n🧐 Running End-to-end Test Suite..."
npx playwright test || exit_code=$?

echo -e "\033[2K\033[80D\033[32m ✔ \033[0m End-to-end test suite complete"


if [ "$exit_code" -eq "0" ]
then
  echo -e "\n\033[42m PASS \033[0m 🎉 All tests have completed successfully!"
else
  echo -e "\n\033[41m FAIL \033[0m 😕 At least one test has failed"
  exit 1
fi

#
# Once testing has completed, rebuild
# This is so that npm run dist (which runs test) end up with a clean build
# 
npm run build production
