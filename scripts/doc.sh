#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

rm -rf ./temp-docs

# Config is in ./typdeoc.json
npx typedoc

# https://github.com/ozum/concat-md
npx concat-md --decrease-title-levels --dir-name-as-title ./temp-docs > ./src/api.md
