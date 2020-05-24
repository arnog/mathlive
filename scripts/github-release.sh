#! bash

set -e  # exit immediately on error

if [ -z "$GH_PUBLISH_TOKEN" ]
then
    echo "The `\$GH_PUBLISH_TOKEN` env variable is not set. Deploy failed."
    echo "Go to GitHub > [user] > Settings > Developer Settings > Personal Access Tokens to create one and set it as an env variable."
    exit 1
fi

# Push the tag that was created by npm version to GitHub
git push origin --tags --verbose


# Create a GitHub release matching this tag
REPO=$(git config --get remote.origin.url | sed -e's/.*://;s/.git$//')

BRANCH=$(git rev-parse --abbrev-ref HEAD)

VERSION=$(git describe --tags)

# RELEASE_NOTE=$(sed -n '1,/^## /p' < CHANGELOG.md | sed '$d' | sed -e 's/$/\\n/' | sed -e 's/"/\\"/g' )

RELEASE_NOTE="See [the Change Log](https://github.com/arnog/mathlive/blob/master/CHANGELOG.md)"

API_JSON=$(printf '{"tag_name": "%s","target_commitish": "master","name": "%s","body": "%s","draft": false,"prerelease": false}' $VERSION $VERSION "$RELEASE_NOTE" )

echo $API_JSON
echo "Creating GitHub release $VERSION for $BRANCH branch of $REPO"

curl -H "Authorization: token $GH_PUBLISH_TOKEN" --data "$API_JSON" "https://api.github.com/repos/$REPO/releases"

