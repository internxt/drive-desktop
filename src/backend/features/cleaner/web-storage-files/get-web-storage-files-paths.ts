import os from 'os';
import path from 'path';
import { WebStorageFilesPaths } from '../cleaner.types';

/**
 * Get all relevant web storage file paths for Chrome, Firefox, and Brave browsers
 */
export function getWebStorageFilesPaths(): WebStorageFilesPaths {
  const homeDir = os.homedir();

  // Chrome paths
  const chromeDefaultProfile = path.join(homeDir, '.config', 'google-chrome', 'Default');

  // Brave paths (snap installation)
  const braveDefaultProfile = path.join(homeDir, 'snap', 'brave', 'current', '.config', 'BraveSoftware', 'Brave-Browser', 'Default');

  return {
    // Chrome paths
    chromeCookies: path.join(chromeDefaultProfile, 'Cookies'),
    chromeLocalStorage: path.join(chromeDefaultProfile, 'Local Storage'),
    chromeSessionStorage: path.join(chromeDefaultProfile, 'Session Storage'),
    chromeIndexedDB: path.join(chromeDefaultProfile, 'IndexedDB'),
    chromeWebStorage: path.join(chromeDefaultProfile, 'WebStorage'),

    // Firefox paths (snap installation) - profiles discovered dynamically
    firefoxProfile: path.join(homeDir, 'snap', 'firefox', 'common', '.mozilla', 'firefox'),

    // Brave paths (snap installation)
    braveCookies: path.join(braveDefaultProfile, 'Cookies'),
    braveLocalStorage: path.join(braveDefaultProfile, 'Local Storage'),
    braveSessionStorage: path.join(braveDefaultProfile, 'Session Storage'),
    braveIndexedDB: path.join(braveDefaultProfile, 'IndexedDB'),
    braveWebStorage: path.join(braveDefaultProfile, 'WebStorage'),
  };
}
