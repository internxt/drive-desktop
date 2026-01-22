const path = require('path');

const rootPath = path.join(__dirname, '../..');

const dllPath = path.join(__dirname, '../dll');

const srcPath = path.join(rootPath, 'src', 'apps');
const srcMainPath = path.join(srcPath, 'main');
const srcRendererPath = path.join(srcPath, 'renderer');
const srcSyncPath = path.join(srcPath, 'workers', 'sync');
const srcBackupsPath = path.join(srcPath, 'backups');
const srcVirtualDrivePath = path.join(srcPath, 'drive');

// Flattened structure - dist and build at root level
const distPath = path.join(rootPath, 'dist');
const distMainPath = path.join(distPath, 'main');
const distRendererPath = path.join(distPath, 'renderer');
const distSyncPath = path.join(distPath, 'sync');
const distBackupsPath = path.join(distPath, 'backups');
const distVirtualDrivePath = path.join(distPath, 'drive');

const buildPath = path.join(rootPath, 'build');

export default {
  rootPath,
  dllPath,
  srcPath,
  srcMainPath,
  srcRendererPath,
  distPath,
  distMainPath,
  distRendererPath,
  buildPath,
  srcSyncPath,
  distSyncPath,
  srcBackupsPath,
  distBackupsPath,
  srcVirtualDrivePath,
  distVirtualDrivePath,
};
