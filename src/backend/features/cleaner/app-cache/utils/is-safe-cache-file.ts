import path from 'path';
/**
 * Critical file extensions that should never be deleted from cache
 */
const CRITICAL_CACHE_EXTENSIONS = [
  '.lock',
  '.pid',
  '.db',
  '.sqlite',
  '.sqlite3',
  '.sock',
  '.socket',
];

/**
 * Critical filename keywords that should never be deleted from cache
 * Examples: session.dat, session.json, preferences.xml, preferences.plist,
 * state.json, window-state, user-settings, app-config
 */
const CRITICAL_CACHE_KEYWORDS = ['session', 'state', 'preferences'];

/**
 * Check if a cache file type is safe to delete (excludes critical file types)
 * Time check should be done separately using wasAccessedWithinLastHour()
 * @param fileName The name of the file
 * @returns true if the file type is safe to delete, false otherwise
 */
export function isSafeCacheFileType(fileName: string): boolean {
  // Extension blacklist check
  const ext = path.extname(fileName).toLowerCase();
  if (CRITICAL_CACHE_EXTENSIONS.includes(ext)) {
    return false;
  }

  // Keyword blacklist check
  const lowerName = fileName.toLowerCase();
  if (CRITICAL_CACHE_KEYWORDS.some((keyword) => lowerName.includes(keyword))) {
    return false;
  }

  return true;
}

/**
 * skips unsafe cache file types
 * Returns true to skip file, false to include file
 */
export function appCacheFileFilter(fileName: string) {
  return !isSafeCacheFileType(fileName);
}
