#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

cd "$(dirname "$0")/.."

if [ "$#" -gt 1 ]; then
    echo -e "\033[40m`basename "$0"`\033[0m\033[31m ERROR \033[0m Expected one argument: 'development' (default) 'watch' 'production' 'docs'"
    exit 1
fi

# Read the first argument, set it to "development" if not set
export BUILD="${1-development}"

# Clean output directories
rm -rf ./docs
rm -rf ./dist
rm -rf ./build

if [ "$BUILD" = "development" ] || [ "$BUILD" = "watch" ] || [ "$BUILD" = "production" ]; then
    mkdir -p dist

    # Copy fonts
    cp -f -R css/fonts dist/
    
    # Build CSS
    npx lessc css/mathlive.core.less dist/mathlive.core.css
    npx lessc css/mathlive.less dist/mathlive.css

    if [ "$BUILD" = "production" ]; then
        # Optimize CSS
        npx postcss dist/*.css -d dist

        # Build docs
        npx jsdoc -c ./jsdoc.conf.json
        printf docs.mathlive.io > docs/CNAME
    fi

    if [ "$BUILD" != "production" ]; then
        # Write sentinel file
        touch dist/DEVELOPMENT-BUILD
    fi

    # Build Typescript types from JSDoc
    npx jsdoc -t node_modules/tsd-jsdoc/dist -d ./build -a public -r ./src/
    mv -f ./build/types.d.ts ./dist/mathlive.d.ts

    if [ "$BUILD" = "watch" ]; then
        # Launch server, do build
        echo "Launching server"
        npx http-server . -c-1 --cors='*' -o examples/test-cases/index.html &

        # do dev build and watch
        BUILD="development"
        npx rollup --config --watch
    else
        # do build (development or production)
        npx rollup --config 
        if [ "$BUILD" = "production" ]; then
            npm run test
        fi
    fi


elif [ "$BUILD" = "docs" ]; then
    # Build docs
    npx jsdoc -c ./jsdoc.conf.json
    printf docs.mathlive.io > docs/CNAME

else
    echo -e "\033[40m`basename "$0"`\033[0m\033[31m ERROR \033[0m Expected: 'development' (default) 'watch' 'production' 'docs'"
    exit 1
fi
