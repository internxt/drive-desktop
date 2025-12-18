const path = require('node:path');

const rootPath = path.join(__dirname, '../..');

const dllPath = path.join(__dirname, '../dll');

const srcPath = path.join(rootPath, 'src', 'apps');
const srcMainPath = path.join(srcPath, 'main');
const srcRendererPath = path.join(srcPath, 'renderer');

const distPath = path.join(rootPath, 'dist');
const distMainPath = path.join(distPath, 'main');
const distRendererPath = path.join(distPath, 'renderer');

const buildPath = path.join(rootPath, 'build');

export const nativeDeps = ['better-sqlite3', 'electron-rebuild', 'typeorm', '@packages/addon'];

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
};
