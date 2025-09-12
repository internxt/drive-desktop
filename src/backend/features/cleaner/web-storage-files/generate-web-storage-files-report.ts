import { CleanableItem, CleanerSection } from '../cleaner.types';
import { scanDirectory } from '../scan-directory';
import { scanSingleFile } from '../scan-single-file';
import { getWebStorageFilesPaths } from './get-web-storage-files-paths';
import { webBrowserFileFilter } from '../utils/is-safe-web-browser-file';
import { scanFirefoxProfiles } from './utils/scan-firefox-profiles';

/**
 * Generates a report for Web Storage Files section by scanning Chrome, Firefox, and Brave storage locations
 * @returns Promise<CleanerSection> Report containing all web storage files
 */
export async function generateWebStorageFilesReport(): Promise<CleanerSection> {
  const paths = getWebStorageFilesPaths();
  const allItems: CleanableItem[] = [];

  const scanSubSectionPromises = [
    // Chrome storage files
    scanSingleFile(paths.chromeCookies),
    scanDirectory({
      dirPath: paths.chromeLocalStorage,
      customFileFilter: webBrowserFileFilter,
    }),
    scanDirectory({
      dirPath: paths.chromeSessionStorage,
      customFileFilter: webBrowserFileFilter,
    }),
    scanDirectory({
      dirPath: paths.chromeIndexedDB,
      customFileFilter: webBrowserFileFilter,
    }),
    scanDirectory({
      dirPath: paths.chromeWebStorage,
      customFileFilter: webBrowserFileFilter,
    }),
    
    // Firefox storage files (requires profile scanning)
    scanFirefoxProfiles(paths.firefoxProfile),
    
    // Brave storage files
    scanSingleFile(paths.braveCookies),
    scanDirectory({
      dirPath: paths.braveLocalStorage,
      customFileFilter: webBrowserFileFilter,
    }),
    scanDirectory({
      dirPath: paths.braveSessionStorage,
      customFileFilter: webBrowserFileFilter,
    }),
    scanDirectory({
      dirPath: paths.braveIndexedDB,
      customFileFilter: webBrowserFileFilter,
    }),
    scanDirectory({
      dirPath: paths.braveWebStorage,
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

  const result = {
    totalSizeInBytes,
    items: allItems,
  };
  return result;
}
