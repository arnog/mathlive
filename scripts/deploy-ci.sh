#! bash

set -e  # exit immediately on error

if [ -z "$GH_PUBLISH_TOKEN" ]
then
    echo "The `\$GH_PUBLISH_TOKEN` env variable is not set. Deploy failed."
    echo "Note: the `deploy-ci` command should only be run from the Travis CI environment"

    exit 1
fi

# Make a production build
## (this is just to check that the build is reproducible
## a production build should have already been pushed by this point)
npm run build production



REPO=$(git config --get remote.origin.url | sed 's/.*:\/\/github.com\///;s/.git$//')

BRANCH=$(git rev-parse --abbrev-ref HEAD)

VERSION=$(git describe --tags)

RELEASE_NOTE=$(sed -n '1,/^## /p' < CHANGELOG.md | sed '$d' | sed -e 's/$/\\n/' | sed -e 's/"/\\"/g' )

API_JSON=$(printf '{"tag_name": "%s","target_commitish": "master","name": "%s","body": "%s","draft": false,"prerelease": false}' $VERSION $VERSION "$RELEASE_NOTE" )

echo "Creating GitHub release $VERSION for $BRANCH branch of $REPO"

curl -H "Authorization: token $GH_PUBLISH_TOKEN" --data "$API_JSON" "https://api.github.com/repos/$REPO/releases"

