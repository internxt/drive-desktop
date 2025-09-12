/**
 * Critical file extensions that should never be deleted from web browser paths (Linux)
 */
const CRITICAL_WEB_STORAGE_EXTENSIONS = ['.lock', '.pid', '.sock', '.socket'];

/**
 * Check if a web browser file is safe to delete based on its extension
 * @param fileName The name of the web storage file
 * @returns true if the file is safe to delete, false otherwise
 */
export function isSafeWebBrowserFile(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();

  // Never delete critical system files
  if (CRITICAL_WEB_STORAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
    return false;
  }

  // Everything else is considered safe to delete for web storage cleanup
  // This includes:
  // - .db, .sqlite, .sqlite3 (browser databases)
  // - .log (browser logs)
  // - .json (settings/data files)
  // - Files without extensions (browser data files)
  // - Any other extensions
  return true;
}

/**
 * Filter function for web files - returns true to skip file, false to include file
 * Used with scan functions' customFileFilter parameter
 */
export function webBrowserFileFilter(fileName: string): boolean {
  return !isSafeWebBrowserFile(fileName);
}
