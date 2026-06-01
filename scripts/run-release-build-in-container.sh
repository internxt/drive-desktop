#!/usr/bin/env bash

set -euo pipefail

# electron-builder expects GH_TOKEN for GitHub publisher flows.
export GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"

if [[ -z "${GH_TOKEN}" ]]; then
  echo "GH_TOKEN/GITHUB_TOKEN is empty inside build container"
  exit 1
fi

npm ci --include=dev

node -e 'const packageJson = require("./package.json"); const { execSync } = require("child_process"); const run = (command) => execSync(command, { encoding: "utf8" }).trim(); const manifest = { platform: process.platform, arch: process.arch, node: process.version, npm: run("npm --version"), go: run("go version"), image: "internxt-release-builder:24.04", electron: packageJson.devDependencies.electron, electronBuilder: packageJson.devDependencies["electron-builder"], electronRebuild: packageJson.devDependencies["@electron/rebuild"], betterSqlite3: packageJson.dependencies["better-sqlite3"] }; process.stdout.write(JSON.stringify(manifest, null, 2));' > build-manifest.json

npm run package

find build -maxdepth 1 -type f \( -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" -o -name "*.yml" \) -print0 \
  | sort -z \
  | xargs -0 sha256sum > build-checksums.txt
