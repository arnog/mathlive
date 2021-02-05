#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

cd "$(dirname "$0")/.."

# Read the first argument, set it to "test" if not set
VARIANT="${1-test}"

if [ ! -d "./dist" ]; then
    echo -e "No build available. Run `npm run build` or `npm run dist`"
    exit 1    
fi


if [ "$VARIANT" = "coverage" ]; then
    printf "\033[32m ● \033[0m Running test suite with coverage"
    npx jest test/  --coverage
    echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Test suite with coverage complete"
elif [ "$VARIANT" = "snapshot" ]; then
    printf "\033[32m ● \033[0m Running test suite snapshot"
    npx jest test/ -u
    echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Test suite snapshot complete"
else
    printf "\033[32m ● \033[0m Running test suite"
    npx jest test/
    echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Test suite complete"
fi