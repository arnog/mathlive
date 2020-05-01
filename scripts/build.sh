#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

cd "$(dirname "$0")/.."

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
    fi

    if [ "$BUILD" != "production" ]; then
        # Write sentinel file
        touch dist/DEVELOPMENT-BUILD
    fi

    # Bundle declaration files (.d.ts)
    # Even though we only generate declaration file, the target must be set high-enough
    # to prevent tsc from complaining (!)
    echo -e "\033[40m`basename "$0"`\033[0m 🚀 Building declaration files (.d.ts)"
    # npx tsc --target "ES5" -d --emitDeclarationOnly --outFile --module system ./dist/mathlive.d.ts ./src/mathlive.api.ts 
    # npx tsc -d --emitDeclarationOnly --outDir dist ./src/mathlive.api.ts 
    # npx tsc --target "ES5" -d --emitDeclarationOnly --outFile ./dist/mathlive.d.ts ./src/public/mathlive.ts 
    npx tsc --target "ES5" -d --emitDeclarationOnly --outDir ./dist ./src/public/mathlive.ts 

    if [ "$BUILD" = "watch" ]; then
        # Do dev build and watch
        echo -e "\033[40m`basename "$0"`\033[0m 🚀 Making a \033[33mdevelopment\033[0m build"
        npx rollup --silent --config --watch
    else
        # Do build (development or production)
        echo -e "\033[40m`basename "$0"`\033[0m 🚀 Making a \033[33m" $BUILD "\033[0m build"
        npx rollup --silent --config 
        if [ "$BUILD" = "production" ]; then
            echo -e "\033[40m`basename "$0"`\033[0m 🚀 Running test suite"
            npx jest --silent
        fi
    fi

else
    echo -e "\033[40m`basename "$0"`\033[0m\033[31m ERROR \033[0m Expected: 'development' (default) 'watch' 'production'"
    exit 1
fi
