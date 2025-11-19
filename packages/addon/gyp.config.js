const fs = require('fs');
const { win32, posix } = require('path');
const path = require('path/posix');

const gypFile = 'binding.gyp';

function getFolders(root) {
  const paths = [root];

  const entries = fs.readdirSync(root, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const parentPath = entry.parentPath.replaceAll(win32.sep, posix.sep);
      const fullPath = path.join(parentPath, entry.name);
      paths.push(fullPath);
    }
  }

  return paths.toSorted();
}

function getFiles(root) {
  const paths = [];

  const entries = fs.readdirSync(root, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      const parentPath = entry.parentPath.replaceAll(win32.sep, posix.sep);
      const fullPath = path.join(parentPath, entry.name);
      paths.push(fullPath);
    }
  }

  return paths.toSorted();
}

function updateGypFile() {
  const fileContent = fs.readFileSync(gypFile);
  const gypData = JSON.parse(fileContent);

  gypData.targets[0].sources = getFiles('native-src');
  gypData.targets[0].include_dirs = getFolders('include');

  fs.writeFileSync(gypFile, JSON.stringify(gypData, null, 2));
}

updateGypFile();
