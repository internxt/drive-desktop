import { execSync } from 'child_process';
import fs from 'fs';
import webpackPaths from '../configs/webpack.paths';

if (fs.existsSync(webpackPaths.appNodeModulesPath)) {
  const electronRebuildCmd = '../../node_modules/.bin/electron-rebuild --sequential --force --types prod,dev,optional --module-dir .';
  const cmd = electronRebuildCmd.replace(/\//g, '\\');
  execSync(cmd, {
    cwd: webpackPaths.appPath,
    stdio: 'inherit',
  });
}
