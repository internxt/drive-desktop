import path from 'node:path';
import os from 'node:os';
import { WebCachePaths } from '../../cleaner.types';

export function getWebCachePaths() {
  const homeDir = os.homedir();
  const localAppData = process.env.LOCALAPPDATA ?? path.join(homeDir, 'AppData', 'Local');
  const firefoxProfilesDir = path.join(localAppData, 'Mozilla', 'Firefox', 'Profiles');

  return {
    chrome: path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
    firefox: firefoxProfilesDir,
    edge: path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache'),
    edgeIECache: path.join(localAppData, 'Microsoft', 'Windows', 'INetCache'),
  } as WebCachePaths;
}
