#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

if git rev-parse --git-dir > /dev/null 2>&1; then 
  git config core.hooksPath ./git-hooks; 
fi