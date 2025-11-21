const { readFileSync, readdirSync, writeFileSync } = require('fs');
const { win32, posix } = require('path');
const { join } = require('path/posix');

const gypFile = 'binding.gyp';

function getFolders(root) {
  const paths = [root];

  const entries = readdirSync(root, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const parentPath = entry.parentPath.replaceAll(win32.sep, posix.sep);
      const fullPath = join(parentPath, entry.name);
      paths.push(fullPath);
    }
  }

  return paths.toSorted();
}

function getFiles(root) {
  const paths = [];

  const entries = readdirSync(root, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      const parentPath = entry.parentPath.replaceAll(win32.sep, posix.sep);
      const fullPath = join(parentPath, entry.name);
      paths.push(fullPath);
    }
  }

  return paths.toSorted();
}

const fileContent = readFileSync(gypFile);
const gypData = JSON.parse(fileContent);

gypData.targets[0].sources = getFiles('native-src');
gypData.targets[0].include_dirs = getFolders('include');

writeFileSync(gypFile, JSON.stringify(gypData, null, 2));
