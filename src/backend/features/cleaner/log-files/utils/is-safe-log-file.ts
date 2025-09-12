/**
 * Safe log file extensions that we're willing to clean
 * These are common log file extensions that are generally safe to delete
 */
const SAFE_LOG_EXTENSIONS = [
  '.log',
  '.txt',
  '.out',
  '.err',
  '.trace',
  '.debug',
  '.info',
  '.warn',
  '.error',
  '.gz', // compressed logs
  '.bz2', // compressed logs
  '.xz', // compressed logs
  '.zip', // compressed logs
];

/**
 * Check if a log file is safe to delete based on its extension
 * @param fileName The name of the log file
 * @returns true if the file extension is safe to delete, false otherwise
 */
export function isSafeLogFile(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  return SAFE_LOG_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

/**
 * Filter function for log files - returns true to skip file, false to include file
 * Used with scan functions' customFileFilter parameter
 */
export function logFileFilter(fileName: string): boolean {
  return !isSafeLogFile(fileName);
}
