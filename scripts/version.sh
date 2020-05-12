#! bash

# This script is run by npm when `npm version` is invoked
# At this point the package.json version field has been
# updated and a corresponding git tag has been created

set -e  # exit immediately on error
cd "$(dirname "$0")/.."

# Update the dist directory with a production build
bash ./scripts/build.sh production 

# Update the CHANGELOG file with the current version number and date

PACKAGE_VERSION=$(node -pe "require('./package.json').version")

DATE_STAMP=$(date +%F)

# On Linux, the -i switch can be used without an extension argument
# On macOS, the -i switch must be followed by an extension argument (which can be empty)
# On Windows, the argument of the -i switch is optional, but if present it must follow it immediately without a space in between
sedi () {
    sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

sedi -e 's/\[Unreleased\]/'"$PACKAGE_VERSION"' ('"$DATE_STAMP"')/g' CHANGELOG.md

git add CHANGELOG.md
git add dist
