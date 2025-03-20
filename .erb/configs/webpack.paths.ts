const path = require('path');

const rootPath = path.join(__dirname, '../..');

const dllPath = path.join(__dirname, '../dll');

const srcPath = path.join(rootPath, 'src', 'apps');
const srcMainPath = path.join(srcPath, 'main');
const srcRendererPath = path.join(srcPath, 'renderer');
const srcBackupsPath = path.join(srcPath, 'backups');
const srcSyncEnginePath = path.join(srcPath, 'sync-engine');

const distPath = path.join(rootPath, 'dist');
const distMainPath = path.join(distPath, 'main');
const distRendererPath = path.join(distPath, 'renderer');
const distBackupsPath = path.join(distPath, 'backups');
const distSyncEnginePath = path.join(distPath, 'sync-engine');

const buildPath = path.join(rootPath, 'build');

export const nativeDeps = ['better-sqlite3', '@internxt/node-win'];

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
  srcBackupsPath,
  distBackupsPath,
  srcSyncEnginePath,
  distSyncEnginePath,
};
