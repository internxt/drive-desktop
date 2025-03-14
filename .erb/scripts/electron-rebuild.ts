import { execSync } from 'child_process';
import fs from 'fs';
import { dependencies } from '../../release/app/package.json';
import webpackPaths from '../configs/webpack.paths';

if (Object.keys(dependencies || {}).length > 0 && fs.existsSync(webpackPaths.appNodeModulesPath)) {
  const electronRebuildCmd = '../../node_modules/.bin/electron-rebuild --sequential --force --types prod,dev,optional --module-dir .';
  const cmd = electronRebuildCmd.replace(/\//g, '\\');
  execSync(cmd, {
    cwd: webpackPaths.appPath,
    stdio: 'inherit',
  });
}
