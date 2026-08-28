#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CORE_DIR = path.join(ROOT, 'packages', 'core');
const ROOT_PACKAGE_JSON = path.join(ROOT, 'package.json');
const DEPENDENCY_LINE = /("@internxt\/drive-desktop-core":\s*"file:packages\/core\/)internxt-drive-desktop-core-[^"]+\.tgz(")/;

function run(command, cwd) {
  console.log(`\n$ ${command}${cwd ? ` (in ${path.relative(ROOT, cwd)})` : ''}`);
  execSync(command, { cwd: cwd ?? ROOT, stdio: 'inherit' });
}

function updateRootDependency(newTgzName) {
  const rootPackageJson = fs.readFileSync(ROOT_PACKAGE_JSON, 'utf8');
  if (!DEPENDENCY_LINE.test(rootPackageJson)) {
    throw new Error('Could not find the @internxt/drive-desktop-core dependency line in the root package.json.');
  }
  fs.writeFileSync(ROOT_PACKAGE_JSON, rootPackageJson.replace(DEPENDENCY_LINE, `$1${newTgzName}$2`));
  console.log(`\nUpdated root package.json to depend on ${newTgzName}`);
}

function main() {
  const ref = process.argv[2] ?? 'origin/master';

  run('git submodule update --init --recursive');
  run('git fetch origin', CORE_DIR);
  run(`git checkout ${ref}`, CORE_DIR);
  run('npm ci', CORE_DIR);
  run('npm run compile', CORE_DIR);
  run('npm pack', CORE_DIR);

  const coreVersion = JSON.parse(fs.readFileSync(path.join(CORE_DIR, 'package.json'), 'utf8')).version;
  const newTgzName = `internxt-drive-desktop-core-${coreVersion}.tgz`;
  if (!fs.existsSync(path.join(CORE_DIR, newTgzName))) {
    throw new Error(`Expected ${newTgzName} to exist in packages/core after "npm pack" but it was not found.`);
  }

  updateRootDependency(newTgzName);

  run('npm update @internxt/drive-desktop-core');
  run('npm run type-check');
  run('npm test -- --run');
  run('git add packages/core package.json package-lock.json');

  const coreCommit = execSync('git rev-parse --short HEAD', { cwd: CORE_DIR }).toString().trim();
  console.log(
    `\nDone. packages/core now points to ${coreCommit} (v${coreVersion}, ${newTgzName}) — staged, review with "git diff --cached" before committing.`,
  );
}

main();
