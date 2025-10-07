import { CleanableItem, CleanerSection } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { getFilePathsToClean } from './get-file-paths-to-clean';
import { cleanerCtx } from '../cleaner.config';

export async function generateWebCacheReport(): Promise<CleanerSection> {
  const pathsToClean = getFilePathsToClean();
  let allItems: CleanableItem[] = [];

  const scanSubSectionPromises = [
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.webCache.chrome,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),

    CleanerModule.scanFirefoxCacheProfiles({ ctx: cleanerCtx, firefoxCacheDir: pathsToClean.webCache.firefox }),

    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.webCache.edge,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),

    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.webCache.edgeIECache,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
  ];

  const results = await Promise.allSettled(scanSubSectionPromises);

  allItems = results.filter((result) => result.status === 'fulfilled').flatMap((result) => result.value);

  const totalSizeInBytes = allItems.reduce((sum, item) => sum + item.sizeInBytes, 0);

  return {
    totalSizeInBytes,
    items: allItems,
  };
}
