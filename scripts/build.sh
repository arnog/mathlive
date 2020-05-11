#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

# Note on the `sed` command:
# On Linux, the -i switch can be used without an extension argument
# On macOS, the -i switch must be followed by an extension argument (which can be empty)
# On Windows, the argument of the -i switch is optional, but if present it must follow it immediately without a space in between



cd "$(dirname "$0")/.."

# Check that correct version of npm and node are installed
npx check-node-version --package

if [ "$#" -gt 1 ]; then
    echo -e "\033[40m`basename "$0"`\033[0m\033[31m ERROR \033[0m Expected one argument: 'development' (default) 'watch' 'production'"
    exit 1
fi

# If no node_modules directory, do an install first
if [ ! -d "./node_modules" ]; then
    echo -e "\033[40m`basename "$0"`\033[0m 🚀 Installing dependencies"
    npm install
fi


# Read the first argument, set it to "development" if not set
export BUILD="${1-development}"

export GIT_VERSION=`git describe --long --dirty`

# Clean output directories
echo -e "\033[40m`basename "$0"`\033[0m 🚀 Cleaning output directories"
rm -rf ./dist
rm -rf ./build
rm -rf ./coverage

if [ "$BUILD" = "development" ] || [ "$BUILD" = "watch" ] || [ "$BUILD" = "production" ]; then
    mkdir -p dist

    # Copy fonts
    echo -e "\033[40m`basename "$0"`\033[0m 🚀 Copying static assets (fonts)"
    cp -f -R css/fonts dist/
    
    # Build CSS
    echo -e "\033[40m`basename "$0"`\033[0m 🚀 Building CSS"
    npx lessc css/mathlive.core.less dist/mathlive.core.css
    npx lessc css/mathlive.less dist/mathlive.css

    if [ "$BUILD" = "production" ]; then
        # Optimize CSS
        echo -e "\033[40m`basename "$0"`\033[0m 🚀 Optimizing CSS"
        npx postcss dist/*.css -d dist
        # Stamp version in output files
        find ./dist -type f -name '*.css' -exec sed -i'' "1s/^/\/\* $GIT_VERSION \*\//" {} \;
    fi

    if [ "$BUILD" != "production" ]; then
        # Write sentinel file. It will be checked in the pre-push.sh script
        # to prevent commiting a dev build to the repo.
        touch dist/DEVELOPMENT-BUILD
    fi

    # Bundle declaration files (.d.ts)
    # Even though we only generate declaration file, the target must be set high-enough
    # to prevent tsc from complaining (!)
    echo -e "\033[40m`basename "$0"`\033[0m 🚀 Building declaration files (.d.ts)"
    npx tsc --target "ES5" -d --emitDeclarationOnly --outDir ./dist ./src/public/mathlive.ts 

    # Stamp version in output declaration files
    if [ "$BUILD" = "production" ]; then
        find ./dist -type f -name '*.d.ts' -exec sed -i'' "1s/^/\/\* $GIT_VERSION \*\/$(printf '\r')/" {} \;
        find ./dist -type f -name '*.d.ts' -exec sed -i'' "s/{{GIT_VERSION}}/$GIT_VERSION/" {} \;
    fi

    if [ "$BUILD" = "watch" ]; then
        # Do dev build and watch
        echo -e "\033[40m`basename "$0"`\033[0m 🚀 Making a \033[33mdevelopment\033[0m build"
        npx rollup --silent --config --watch
    else
        # Do build (development or production)
        echo -e "\033[40m`basename "$0"`\033[0m 🚀 Making a \033[33m" $BUILD "\033[0m build"
        npx rollup --silent --config 
        if [ "$BUILD" = "production" ]; then
            # Stamp the Git version number
            find ./dist -type f \( -name '*.mjs' -o -name '*.js' \) -exec sed -i'' "s/{{GIT_VERSION}}/$GIT_VERSION/g" {} \;
            # Run test suite
            echo -e "\033[40m`basename "$0"`\033[0m 🚀 Running test suite"
            npx jest --silent
        fi
    fi

else
    echo -e "\033[40m`basename "$0"`\033[0m\033[31m ERROR \033[0m Expected: 'development' (default) 'watch' or 'production'"
    exit 1
fi
