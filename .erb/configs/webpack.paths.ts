const path = require('path');

const rootPath = path.join(__dirname, '../..');

const dllPath = path.join(__dirname, '../dll');

const srcPath = path.join(rootPath, 'src', 'apps');
const srcMainPath = path.join(srcPath, 'main');
const srcRendererPath = path.join(srcPath, 'renderer');
const srcSyncPath = path.join(srcPath, 'workers', 'sync');
const srcBackupsPath = path.join(srcPath, 'workers', 'backups');
const srcSyncEnginePath = path.join(srcPath, 'sync-engine');
const srcVirtualDrivePath = path.join(srcPath, 'drive');

const releasePath = path.join(rootPath, 'release');
const appPath = path.join(releasePath, 'app');
const appPackagePath = path.join(appPath, 'package.json');
const appNodeModulesPath = path.join(appPath, 'node_modules');
const srcNodeModulesPath = path.join(srcPath, 'node_modules');

const distPath = path.join(appPath, 'dist');
const distMainPath = path.join(distPath, 'main');
const distRendererPath = path.join(distPath, 'renderer');
const distSyncPath = path.join(distPath, 'sync');
const distBackupsPath = path.join(distPath, 'backups');
const distSyncEnginePath = path.join(distPath, 'sync-engine');
const distVirtualDrivePath = path.join(distPath, 'drive');

const buildPath = path.join(releasePath, 'build');

export default {
  rootPath,
  dllPath,
  srcPath,
  srcMainPath,
  srcRendererPath,
  releasePath,
  appPath,
  appPackagePath,
  appNodeModulesPath,
  srcNodeModulesPath,
  distPath,
  distMainPath,
  distRendererPath,
  buildPath,
  srcSyncPath,
  distSyncPath,
  srcBackupsPath,
  distBackupsPath,
  srcSyncEnginePath,
  distSyncEnginePath,
  srcVirtualDrivePath,
  distVirtualDrivePath,
};
