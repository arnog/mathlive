#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

export RESET="\033[0m"
export DOT="\033[32m\033[1K ● \033[0m"
export CHECK="\033[32m\033[1K ✔ \033[0m"
export ERROR="\033[31m ❌ ERROR \033[0m"
export EMPH="\033[33m"
export LINECLEAR="\033[1G\033[2K" # position to column 1; erase whole line

# Note on the `sed` command:
# On Linux, the -i switch can be used without an extension argument
# On macOS, the -i switch must be followed by an extension argument (which can be empty)
# On Windows, the argument of the -i switch is optional, but if present it must follow it immediately without a space in between
sedi () {
    sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}
export -f sedi

cd "$(dirname "$0")/.."

# Check that correct version of npm and node are installed
npx check-node-version --package

# If no "node_modules" directory, do an install first
if [ ! -d "./node_modules" ]; then
    printf "${DOT}Installing dependencies"
    npm install
    echo -e "${LINECLEAR}${CHECK} Dependencies installed"
fi

# export GIT_VERSION=`git describe --long --dirty`

export SDK_VERSION=$(cat package.json \
| grep version \
| head -1 \
| awk -F: '{ print $2 }' \
| sed 's/[",]//g' \
| tr -d '[[:space:]]')

# Clean output directories
printf "${DOT} Cleaning output directories"
rm -rf ./dist
rm -rf ./declarations
rm -rf ./build
rm -rf ./coverage

mkdir -p dist
mkdir -p declarations
echo -e "${LINECLEAR}${CHECK} Output directories cleaned out"

# Copy static assets
printf "${DOT} Copying static assets (fonts, sounds)"
cp -f -R css/fonts dist/
cp -f -R sounds dist/
echo -e "${LINECLEAR}${CHECK} Static assets copied"



# Do dev build and watch
node ./scripts/start.mjs 
