#! bash

set -e  # exit immediately on error

# 
if [ -f "dist/DEVELOPMENT-BUILD" ]; then
    # There's a "DEVELOPMENT-BUILD" sentinel file in dist
    echo "Removing dist/ from commit list"
    git reset dist/
fi
