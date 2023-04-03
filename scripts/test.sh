#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

cd "$(dirname "$0")/.."

# Read the first argument, set it to "test" if not set
VARIANT="${1-test}"

if [ ! -d "./dist" ]; then
    echo -e "\n❌ No build available. Run 'npm run build' or 'npm run dist'"
    exit 1    
fi

exit_code=0

echo -e "\n🧐 Running unit tests..."

if [ "$VARIANT" = "coverage" ]; then
    printf "\033[32m ● \033[0m Running test suite with coverage"
    npx jest test/  --coverage || exit_code=$?
    echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Test suite with coverage complete"
elif [ "$VARIANT" = "snapshot" ]; then
    printf "\033[32m ● \033[0m Running test suite snapshot"
    npx jest test/ -u || exit_code=$?
    echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Test suite snapshot complete"
else
    printf "\033[32m ● \033[0m Running test suite"
    npx jest test/ || exit_code=$?
    echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Test suite complete"
fi

#
# Validate that the public declaration files do not reference
# private types
#

echo -e "\n🧐 Running type tests..."

if [ ! -d "./dist/public" ]; then
  echo -e "\n❌ No build with declaration file available. Run 'npm run build'"
  exit 1    
else
  npx tsc --noEmit --baseUrl ./dist/public ./test/public-ts-declarations/main.ts || exit_code=$?
fi

# Run playwright end-to-end tests
echo -e "\n🧐 Running end-to-end tests..."
npx playwright test || exit_code=$?

echo $exit_code

if [ "$exit_code" -eq "0" ]
then
  echo -e "\n🎉 All tests have completed successfully!"
  exit 0
else
  echo -e "\n❌ At least one test has failed"
  exit 1
fi
