/**
 * Web browser directory names that should be excluded from app cache
 * These belong in the "Web cache" category instead
 */
const WEB_BROWSER_DIRECTORIES = [
  'google-chrome',
  'chromium',
  'firefox',
  'opera',
  'brave'
];

/**
 * Check if a directory name is related to a web browser
 * @param directoryName The name of the directory
 * @returns true if the directory is browser-related, false otherwise
 */
export function isDirectoryWebBrowserRelated(directoryName: string): boolean {
  const lowerName = directoryName.toLowerCase();
  return WEB_BROWSER_DIRECTORIES.some((browserName) =>
    lowerName.includes(browserName)
  );
}
