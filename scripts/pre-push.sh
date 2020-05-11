#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

# 
if [ -f "dist/DEVELOPMENT-BUILD" ]; then
    # There's a "DEVELOPMENT-BUILD" sentinel file in dist
    echo "Removing dist/ from commit list"
    echo "Run `npm run build production` to update dist/"
    git reset dist/
fi

# Run test suite
npx jest
