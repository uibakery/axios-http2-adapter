#!/bin/bash

# Stop script if any command fails
set -e

# Use 'npm version patch', 'npm version minor', or 'npm version major'
VERSION_BUMP_TYPE=$1 # pass 'patch', 'minor', or 'major' as an argument

if [ -z "$VERSION_BUMP_TYPE" ]; then
    echo "Version bump type (patch, minor, major) is required"
    exit 1
fi

git checkout -b release/v$(node -p "require('./package.json').version")

npm version $VERSION_BUMP_TYPE

npm run build

npm test

git add .

git commit -m "Release v$(node -p "require('./package.json').version")"

echo "Push, merge, and run \"npm run release:publish\""
