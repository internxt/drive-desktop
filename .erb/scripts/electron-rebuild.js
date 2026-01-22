import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import { dependencies } from '../../package.json';
import webpackPaths from '../configs/webpack.paths';

if (
  Object.keys(dependencies || {}).length > 0 &&
  fs.existsSync(path.join(webpackPaths.rootPath, 'node_modules'))
) {
  const electronRebuildCmd =
    './node_modules/.bin/electron-rebuild --sequential --force --types prod,dev,optional --module-dir .';
  const cmd =
    process.platform === 'win32'
      ? electronRebuildCmd.replace(/\//g, '\\')
      : electronRebuildCmd;
  execSync(cmd, {
    cwd: webpackPaths.rootPath,
    stdio: 'inherit',
  });
}
