import path from 'node:path';
import os from 'node:os';
import { WebStoragePaths } from '../../cleaner.types';

export function getWebStorageFilePaths() {
  const homeDir = os.homedir();
  const localAppData = process.env.LOCALAPPDATA ?? path.join(homeDir, 'AppData', 'Local');
  const appData = process.env.APPDATA ?? path.join(homeDir, 'AppData', 'Roaming');
  const firefoxProfilesDir = path.join(appData, 'Mozilla', 'Firefox', 'Profiles');

  return {
    chrome: {
      cookies: path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Cookies'),
      localStorage: path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Local Storage'),
    },
    edge: {
      cookies: path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cookies'),
      localStorage: path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Local Storage'),
    },
    firefox: firefoxProfilesDir,
  } as WebStoragePaths;
}
