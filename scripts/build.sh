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

if [ "$#" -gt 1 ]; then
    echo -e "\033[40m`basename "$0"`${RESET}${ERROR} Expected at most one argument: 'development' (default), 'watch' or 'production'"
    exit 1
fi

# Check that correct version of npm and node are installed
npx check-node-version --package

# If no "node_modules" directory, do an install first
if [ ! -d "./node_modules" ]; then
    printf "${DOT}Installing dependencies"
    npm install
    echo -e "${LINECLEAR}${CHECK} Dependencies installed"
fi


# Read the first argument, set it to "development" if not set
export BUILD="${1-development}"

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


# Build CSS
printf "${DOT} Building static CSS"
npx lessc css/mathlive-static.less dist/mathlive-static.css
npx lessc css/mathlive-fonts.less dist/mathlive-fonts.css
echo -e "${LINECLEAR}${CHECK} Static CSS built"

if [ "$BUILD" = "production" ]; then
    # Optimize CSS
    printf "${DOT} Optimizing CSS"
    npx postcss dist/*.css -d dist
    echo -e "${LINECLEAR}${CHECK} CSS Optimized"
fi

# Bundle Typescript declaration files (.d.ts).
# Even though we only generate declaration files, the target must be set 
# high-enough to prevent `tsc` from complaining (!)
printf "${DOT} Building declaration files (.d.ts)"
npx tsc --target "es2020" -d --moduleResolution "node" --emitDeclarationOnly --outDir ./declarations ./src/public/mathlive.ts 
mv ./declarations/public ./dist
rm -rf ./declarations
echo -e "${LINECLEAR}${CHECK} Declaration files built"



if [ "$BUILD" = "watch" ]; then
    # Do dev build and watch
    printf "${DOT} Making a ${EMPH}watch${RESET} build"
    npx rollup --silent --config --watch
    echo -e "${LINECLEAR}${CHECK} ${EMPH}watch${RESET} build done"
else
    # Do build (development or production)
    printf "${DOT} Making a ${EMPH}${BUILD}${RESET} build"
    npx rollup --silent --config 
    echo -e "${LINECLEAR}${CHECK} ${EMPH}${BUILD}${RESET} build done"

    if [ "$BUILD" = "production" ]; then
        # Stamp the SDK version number
        printf "${DOT} Stamping output files"
        find ./dist -type f -name '*.css' -exec bash -c 'sedi "1s/^/\/\* $SDK_VERSION \*\//" {}' \;
        find ./dist -type f \( -name '*.mjs' -o -name '*.js' \) -exec bash -c 'sedi s/{{SDK_VERSION}}/$SDK_VERSION/g {}' \;
        find ./dist -type f -name '*.d.ts' -exec bash -c 'sedi "1s/^/\/\* $SDK_VERSION \*\/$(printf '"'"'\r'"'"')/" {}' \;
        find ./dist -type f -name '*.d.ts' -exec bash -c 'sedi "s/{{SDK_VERSION}}/$SDK_VERSION/" {}' \;
        echo -e "${LINECLEAR}${CHECK} Output files stamped"
    fi
fi

