#! bash

# set -e  # exit immediately on error

export RESET="\033[0m"
export DOT="\033[32m\033[1K ● \033[0m"
export CHECK="\033[32m\033[1K ✔ \033[0m"
export ERROR="\033[31m ❌ ERROR \033[0m"
export EMPH="\033[33m"
export LINECLEAR="\033[1G\033[2K" # position to column 1; erase whole line


if [ -z "$GH_PUBLISH_TOKEN" ]
then
    echo "The `\$GH_PUBLISH_TOKEN` env variable is not set. Coult not deploy to GitHub."
    echo "Go to GitHub > [user] > Settings > Developer Settings > Personal Access Tokens to create one and set it as an env variable."
    exit 1
fi

AUTH="Authorization: token $GH_PUBLISH_TOKEN"


# Push the tag that was created by npm version to GitHub
# git push origin --tags --verbose


# Create a GitHub release matching this tag
REPO=$(git config --get remote.origin.url | sed 's/.*\/\([^ ]*\/[^.]*\).*/\1/')

BRANCH=$(git rev-parse --abbrev-ref HEAD)

VERSION=$(git describe --tags)

# RELEASE_NOTE=$(sed -n '1,/^## /p' < CHANGELOG.md | sed '$d' | sed -e 's/$/\\n/' | sed -e 's/"/\\"/g' )

RELEASE_NOTE="See [the Change Log](https://cortexjs.io/mathlive/changelog/)"

API_JSON=$(printf '{"tag_name": "%s","target_commitish": "master","name": "%s","body": "%s","draft": false,"prerelease": false}' $VERSION $VERSION "$RELEASE_NOTE" )
# echo $API_JSON


# Validate token.
curl -sH "$AUTH" "https://api.github.com/repos/$REPO" || { echo "Error: Invalid repo, token or network issue!";  exit 1;}

echo "${DOT}Creating GitHub release $VERSION for $BRANCH branch of $REPO"

curl -H $AUTH --data "$API_JSON" "https://api.github.com/repos/$REPO/releases"

