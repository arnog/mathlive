#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

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
    echo -e "\033[40m`basename "$0"`\033[0m\033[31m ERROR \033[0m Expected at most one argument: 'development' (default), 'watch' or 'production'"
    exit 1
fi

# Check that correct version of npm and node are installed
npx check-node-version --package

# If no "node_modules" directory, do an install first
if [ ! -d "./node_modules" ]; then
    printf "\033[32m\033[1K ● \033[0Installing dependencies"
    npm install
    echo -e "\033[32m\033[1K ✔ \033[0Dependencies installed"
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
printf "\033[32m ● \033[0m Cleaning output directories"
rm -rf ./dist
rm -rf ./declarations
rm -rf ./build
rm -rf ./coverage

mkdir -p dist
mkdir -p declarations
echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Output directories cleaned out"

if [ "$BUILD" != "production" ]; then
    # Write sentinel file. It will be checked in the pre-push.sh script
    # to prevent commiting a dev build to the repo.
    touch dist/DEVELOPMENT-BUILD
fi

# Bundle declaration files (.d.ts)
# Even though we only generate declaration file, the target must be set high-enough
# to prevent tsc from complaining (!)
printf "\033[32m ● \033[0m Building declaration files (.d.ts)"
npx tsc --target "es2020" -d --moduleResolution "node" --emitDeclarationOnly --outDir ./declarations ./src/public/mathlive.ts 
mv ./declarations/public ./dist
# mv ./declarations/math-json/ ./dist
rm -rf ./declarations
echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Declaration files built"

# Copy fonts
printf "\033[32m ● \033[0m Copying static assets (fonts, sounds)"
cp -f -R css/fonts dist/
cp -f -R sounds dist/
echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Static assets copied"

# Build CSS
printf "\033[32m ● \033[0m Building static CSS"
npx lessc css/mathlive-static.less dist/mathlive-static.css
npx lessc css/mathlive-fonts.less dist/mathlive-fonts.css
echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Static CSS built"

if [ "$BUILD" = "watch" ]; then
    # Do dev build and watch
    printf "\033[32m ● \033[0m Making a \033[33mdevelopment\033[0m build"
    npx rollup --silent --config --watch
    echo -e "\033[2K\033[80D\033[32m ✔ \033[33mdevelopment\033[0m build done"
else
    # Do build (development or production)
    printf "\033[32m ● \033[0m Making a \033[33m%s\033[0m build" "$BUILD"
    npx rollup --silent --config 
    echo -e "\033[2K\033[80D\033[32m ✔ \033[33m" $BUILD "\033[0m build done"

    if [ "$BUILD" = "production" ]; then
        # Optimize CSS
        printf "\033[32m ● \033[0m Optimizing CSS"
        npx postcss dist/*.css -d dist
        echo -e "\033[2K\033[80D\033[32m ✔ \033[0m CSS Optimized"

        # Stamp the SDK version number
        printf "\033[32m ● \033[0m Stamping output files"
        find ./dist -type f -name '*.css' -exec bash -c 'sedi "1s/^/\/\* $SDK_VERSION \*\//" {}' \;
        find ./dist -type f \( -name '*.mjs' -o -name '*.js' \) -exec bash -c 'sedi s/{{SDK_VERSION}}/$SDK_VERSION/g {}' \;
        find ./dist -type f -name '*.d.ts' -exec bash -c 'sedi "1s/^/\/\* $SDK_VERSION \*\/$(printf '"'"'\r'"'"')/" {}' \;
        find ./dist -type f -name '*.d.ts' -exec bash -c 'sedi "s/{{SDK_VERSION}}/$SDK_VERSION/" {}' \;
        echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Output files stamped"

        # Linting
        # echo -e "\033[40m`basename "$0"`\033[0m 🚀 Linting"
        # npm run lint

        # Run test suite
        printf "\033[32m ● \033[0m Running test suite"
        npx jest test
        echo -e "\033[2K\033[80D\033[32m ✔ \033[0m Test suite complete"
    fi
fi

