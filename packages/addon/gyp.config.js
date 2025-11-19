const fs = require('fs');
const path = require('path/posix');

const gypFile = 'binding.gyp';

function gatherFiles(pattern, isDirectory = false) {
  const allPaths = [];

  if (isDirectory) {
    function walk(dir) {
      allPaths.push(dir);

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name));
        }
      }
    }

    walk(pattern);
  } else {
    function walkFiles(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          walkFiles(fullPath);
        } else if (entry.isFile()) {
          allPaths.push(fullPath);
        }
      }
    }

    walkFiles(pattern);
  }

  return allPaths.toSorted();
}

function updateGypFile() {
  const fileContent = fs.readFileSync(gypFile);
  const gypData = JSON.parse(fileContent);

  gypData.targets[0].sources = gatherFiles('native-src');
  gypData.targets[0].include_dirs = gatherFiles('include', true);

  fs.writeFileSync(gypFile, JSON.stringify(gypData, null, 2));
}

updateGypFile();
