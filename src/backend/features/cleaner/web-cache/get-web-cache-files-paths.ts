import os from 'os';
import path from 'path';
import { WebCacheFilesPaths } from '../cleaner.types';

/**
 * Get all relevant web cache paths for Chrome, Firefox, and Brave browsers
 */
export function getWebCacheFilesPaths(): WebCacheFilesPaths {
  const homeDir = os.homedir();

  return {
    chromeCacheDir: path.join(
      homeDir,
      '.cache',
      'google-chrome',
      'Default',
      'Cache'
    ),
    firefoxCacheDir: path.join(
      homeDir,
      'snap',
      'firefox',
      'common',
      '.cache',
      'mozilla',
      'firefox'
    ),
    braveCacheDir: path.join(
      homeDir,
      'snap',
      'brave',
      'common',
      '.cache',
      'BraveSoftware',
      'Brave-Browser',
      'Default',
      'Cache'
    ),
  };
}
