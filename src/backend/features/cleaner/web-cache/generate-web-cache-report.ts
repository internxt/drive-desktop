import { CleanableItem, CleanerSection } from '../cleaner.types';
import { scanDirectory } from '../scan-directory';
import { webBrowserFileFilter } from '../utils/is-safe-web-browser-file';
import { getWebCacheFilesPaths } from './get-web-cache-files-paths';
import { scanFirefoxCacheProfiles } from './utils/scan-firefox-cache-profiles';

/**
 * Generates a report for Web Cache section by scanning Chrome, Firefox, and Brave cache directories
 * @returns Promise<CleanerSection> Report containing all web cache files
 */
export async function generateWebCacheReport(): Promise<CleanerSection> {
  const paths = getWebCacheFilesPaths();
  const allItems: CleanableItem[] = [];

  const scanSubSectionPromises = [
    /**
     * Scan ~/.cache/google-chrome/Default/Cache/
     */
    scanDirectory({
      dirPath: paths.chromeCacheDir,
      customFileFilter: webBrowserFileFilter,
    }),
    /**
     * Scan ~/snap/firefox/common/.cache/mozilla/firefox/ (requires profile scanning)
     */
    scanFirefoxCacheProfiles(paths.firefoxCacheDir),
    /**
     * Scan ~/snap/brave/common/.cache/BraveSoftware/Brave-Browser/Default/Cache/
     */
    scanDirectory({
      dirPath: paths.braveCacheDir,
      customFileFilter: webBrowserFileFilter,
    }),
  ];

  const results = await Promise.allSettled(scanSubSectionPromises);

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  });

  const totalSizeInBytes = allItems.reduce(
    (sum, item) => sum + item.sizeInBytes,
    0
  );

  return {
    totalSizeInBytes,
    items: allItems,
  };
}
