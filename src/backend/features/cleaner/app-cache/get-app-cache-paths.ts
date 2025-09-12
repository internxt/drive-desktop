import path from 'path';
import os from 'os';
import { AppCachePaths } from '../cleaner.types';

/**
 * Get all relevant app cache paths based on system configuration
 */
export function getAppCachePaths(): AppCachePaths {
  const homeDir = os.homedir();
  const defaultUserCache = path.join(homeDir, '.cache');
  const xdgCache = process.env.XDG_CACHE_HOME;
  return {
    userCache:
      xdgCache && xdgCache !== defaultUserCache ? xdgCache : defaultUserCache,
    tmpDir: '/tmp',
    varTmpDir: '/var/tmp',
    localShareCache: path.join(homeDir, '.local', 'share'),
  };
}
