#!/bin/bash

# Stop script if any command fails
set -e

git pull

git tag "v$(node -p "require('./package.json').version")"

git push origin master --tags

npm publish
