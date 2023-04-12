#!/bin/bash

set -e  # exit immediately on error
set -o nounset   # abort on unbound variable
set -o pipefail  # don't hide errors within pipes
# set -x    # for debuging, trace what is being executed.

export EMPH="\033[33m"

export BASENAME="\033[40m MathLive \033[0;0m " # `basename "$0"`
export DOT="\033[32m 羽 \033[0;0m" # Hourglass
export CHECK="\033[32m ✔ \033[0;0m"
export DIM="\033[0;2m"
export RESET="\033[0;0m"
export ERROR="\033[31;7m ERROR \033[0;0m"
export LINECLEAR="\033[1G\033[2K" # position to column 1; erase whole line

cd "$(dirname "$0")/.."

if [ "$#" -gt 1 ]; then
    echo -e "$BASENAME${ERROR} Expected at most one argument: 'development' (default), 'watch' or 'production'"
    exit 1
fi

# Check that correct version of npm and node are installed
npx check-node-version --package

# If no "node_modules" directory, do an install first
if [ ! -d "./node_modules" ]; then
    printf "$BASENAME${DOT}Installing dependencies"
    npm install
    echo -e "${LINECLEAR}$BASENAME${CHECK}Dependencies installed"
fi


# Read the first argument, set it to "production" if not set
export BUILD="${1-production}"

# export GIT_VERSION=`git describe --long --dirty`


#
# Clean output directories
#
printf "$BASENAME${DOT}Cleaning output directories"
rm -rf ./dist
rm -rf ./declarations
rm -rf ./build
rm -rf ./coverage

mkdir -p dist
mkdir -p declarations
echo -e  $LINECLEAR$BASENAME$CHECK${DIM}"Cleaning output directories"$RESET



#
# Build TypeScript declaration files (.d.ts).
#
printf "$BASENAME${DOT}Building TypeScript declaration files (.d.ts)"
npx tsc --project ./tsconfig.json --declaration --emitDeclarationOnly  --outDir ./declarations
# npx tsc ./src/public/mathlive-ssr.ts --moduleResolution nodenext --target es2020 --module esnext --lib es2020,dom,dom.iterable,scripthost --declaration --emitDeclarationOnly  --typeRoots ./src/public --outDir ./declarations
mkdir ./dist/types
mv ./declarations/src/public/* ./dist/types
cp -f ./src/public/cortex-compute-engine.d.ts ./dist/types/
# rm -rf ./declarations
echo -e "$LINECLEAR$BASENAME$CHECK${DIM}TypeScript declaration files built${RESET}"

# Copy static assets
printf "$BASENAME${DOT}Copying static assets (fonts, sounds)"
cp -f -R css/fonts dist/
cp -f -R sounds dist/
echo -e "$LINECLEAR$BASENAME$CHECK${DIM}Static assets copied${RESET}"


#
# Build CSS
#
printf "$BASENAME${DOT}Building static CSS"
npx lessc css/mathlive-static.less dist/mathlive-static.css
npx lessc css/mathlive-fonts.less dist/mathlive-fonts.css
echo -e "$LINECLEAR$BASENAME$CHECK${DIM}Static CSS built${RESET}"

if [ "$BUILD" = "production" ]; then
    # Optimize CSS
    printf "$BASENAME${DOT}Optimizing CSS"
    npx postcss dist/*.css -d dist
    echo -e "$LINECLEAR$BASENAME$CHECK${DIM}CSS Optimized${RESET}"
fi


#
# Do build (development or production)
#
printf "$BASENAME${DOT}Making a ${EMPH}${BUILD}${RESET} build"
node --experimental-json-modules ./scripts/build.mjs
echo -e "$LINECLEAR$BASENAME$CHECK${EMPH}${BUILD}${RESET}${DIM} build done${RESET}"



if [ "$BUILD" = "production" ]; then
    #
    # Stamp the SDK version number
    #

    # Note on the `sed` command:
    # On Linux, the -i switch can be used without an extension argument
    # On macOS, the -i switch must be followed by an extension argument (which can be empty)
    # On Windows, the argument of the -i switch is optional, but if present it must follow it immediately without a space in between
    sedi () {
        sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
    }
    export -f sedi


    export SDK_VERSION=$(cat package.json \
    | grep version \
    | head -1 \
    | awk -F: '{ print $2 }' \
    | sed 's/[",]//g' \
    | tr -d '[[:space:]]')

    printf "$BASENAME${DOT}Stamping output files"
    find ./dist -type f -name '*.css' -exec bash -c 'sedi "1s/^/\/\* $SDK_VERSION \*\//" {}' \;
    find ./dist -type f \( -name '*.mjs' -o -name '*.js' \) -exec bash -c 'sedi s/{{SDK_VERSION}}/$SDK_VERSION/g {}' \;
    find ./dist -type f -name '*.d.ts' -exec bash -c 'sedi "1s/^/\/\* $SDK_VERSION \*\/$(printf '"'"'\r'"'"')/" {}' \;
    find ./dist -type f -name '*.d.ts' -exec bash -c 'sedi "s/{{SDK_VERSION}}/$SDK_VERSION/" {}' \;

    # "Correct" the path to compute engine emitted by tsc
    find ./dist -type f -name '*.d.ts' -exec bash -c 'sedi "s/types=\"public/types=\"\./" {}' \;




    echo -e "$LINECLEAR$BASENAME$CHECK${DIM}Output files stamped${RESET}"
fi
