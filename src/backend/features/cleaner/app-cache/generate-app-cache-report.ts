import { CleanerSection, CleanableItem } from '../cleaner.types';
import { scanDirectory } from '../scan-directory';
import { getAppCachePaths } from './get-app-cache-paths';
import { scanSubDirectory } from '../scan-subdirectory';
import { appCacheFileFilter } from './utils/is-safe-cache-file';
import { isDirectoryWebBrowserRelated } from './utils/is-directory-web-browser-related';

/**
 * Generates a report for App Cache section by scanning various cache directories
 * @returns Promise<CleanerSection> Report containing all app cache files
 */
export async function generateAppCacheReport(): Promise<CleanerSection> {
  const paths = getAppCachePaths();
  const allItems: CleanableItem[] = [];

  const scanSubSectionPromises = [
    /**
     * Scan ~/.cache/[AppName]/ directories
     */
    scanDirectory({
      dirPath: paths.userCache,
      customFileFilter: appCacheFileFilter,
      customDirectoryFilter: isDirectoryWebBrowserRelated,
    }),
    /**
     * Scan /tmp/ for temporary files
     */
    scanDirectory({
      dirPath: paths.tmpDir,
      customFileFilter: appCacheFileFilter,
    }),
    /**
     * Scan /var/tmp/ for system temporary files
     */
    scanDirectory({
      dirPath: paths.varTmpDir,
      customFileFilter: appCacheFileFilter,
    }),
    /**
     * Scan ~/.local/share/[AppName]/cache/ directories
     */
    scanSubDirectory({
      baseDir: paths.localShareCache,
      subPath: 'cache',
      customDirectoryFilter: isDirectoryWebBrowserRelated,
      customFileFilter: appCacheFileFilter,
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
