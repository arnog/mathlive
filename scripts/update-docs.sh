#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

export BASENAME="\033[40m MathLive \033[0;0m " # `basename "$0"`
export CHECK="\033[32m ✔ \033[0;0m"
export DOT="\033[32m ⌛ \033[0;0m" # Hourglass

printf "${BASENAME}${DOT}Updating the documentation\n"


rm -rf ./temp-docs

# Config is in ./typdeoc.json
npx typedoc

# https://github.com/ozum/concat-md
npx concat-md --decrease-title-levels --dir-name-as-title ./temp-docs > ./src/api.md

rm -rf ./temp-docs

printf "${BASENAME}${CHECK}Documentation updated\n"