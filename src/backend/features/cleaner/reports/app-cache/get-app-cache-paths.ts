import path from 'node:path';
import os from 'node:os';
import { AppCachePaths } from '../../cleaner.types';

export function getWindowsAppCachePaths() {
  const homeDir = os.homedir();
  const localAppData = process.env.LOCALAPPDATA ?? path.join(homeDir, 'AppData', 'Local');
  const appData = process.env.APPDATA ?? path.join(homeDir, 'AppData', 'Roaming');
  const tempDir = process.env.TEMP ?? os.tmpdir();

  return {
    localCache: localAppData,
    roamingCache: appData,
    tmpDir: tempDir,
    systemTmpDir: 'C:\\Windows\\Temp',
  } as AppCachePaths;
}
