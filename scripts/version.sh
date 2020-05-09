#! bash

# This script is run by npm when the deploy script is run 
# (it's called by npm version)

set -e  # exit immediately on error
cd "$(dirname "$0")/.."

# Update the CHANGELOG file with the current version number and date

PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g')

DATE_STAMP=$(date +%F)

sed -i '' -e 's/\[Unreleased\]/'"$PACKAGE_VERSION"' ('"$DATE_STAMP"')/g' CHANGELOG.md
git add CHANGELOG.md
git add dist