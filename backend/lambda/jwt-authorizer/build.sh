#!/bin/bash
set -e

echo "Building JWT Authorizer Lambda..."
cd "$(dirname "$0")"

npm install --omit=dev
zip -r authorizer.zip index.js node_modules/

echo "Done: authorizer.zip created"
