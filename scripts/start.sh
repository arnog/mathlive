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

cd "$(dirname "$0")/.."

# Check that correct version of npm and node are installed
npx check-node-version --package

# If no "node_modules" directory, do an install first
if [ ! -d "./node_modules" ]; then
    printf "${DOT}Installing dependencies"
    npm install
    echo -e "${LINECLEAR}${CHECK} Dependencies installed"
fi

# Clean output directories
printf "${LINECLEAR}${DOT} Cleaning output directories"
rm -rf ./dist
rm -rf ./declarations
rm -rf ./build
rm -rf ./coverage

mkdir -p dist

# Copy static assets
printf "${LINECLEAR}${DOT} Copying static assets (fonts, sounds)"
cp -f -R css/fonts dist/
cp -f -R sounds dist/
echo -e "${LINECLEAR}"

# Build CSS
printf "$LINECLEAR${DOT}Building static CSS"
npx lessc css/mathlive-static.less dist/mathlive-static.css
npx lessc css/mathlive-fonts.less dist/mathlive-fonts.css
echo -e "$LINECLEAR$CHECK Static CSS built${RESET}"

# Do dev build and watch
node ./scripts/start.js&
npx tsc --watch --noEmit --preserveWatchOutput
