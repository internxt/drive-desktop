import { CleanerSection, CleanableItem } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { cleanerCtx } from '../cleaner.config';
import { getFilePathsToClean } from './get-file-paths-to-clean';

export async function generateAppCacheReport(): Promise<CleanerSection> {
  const pathsToClean = getFilePathsToClean();
  let allItems: CleanableItem[] = [];

  const scanSubSectionPromises = [
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.cache.tempDir,
      customFileFilter: CleanerModule.appCacheFileFilter,
      customDirectoryFilter: CleanerModule.isDirectoryWebBrowserRelated,
    }),

    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.cache.systemTmpDir,
      customFileFilter: CleanerModule.appCacheFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: pathsToClean.localAppData,
      subPath: 'cache',
      customDirectoryFilter: CleanerModule.isDirectoryWebBrowserRelated,
      customFileFilter: CleanerModule.appCacheFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: pathsToClean.roamingAppData,
      subPath: 'cache',
      customDirectoryFilter: CleanerModule.isDirectoryWebBrowserRelated,
      customFileFilter: CleanerModule.appCacheFileFilter,
    }),
  ];

  const results = await Promise.allSettled(scanSubSectionPromises);

  allItems = results.filter((result) => result.status === 'fulfilled').flatMap((result) => result.value);

  const totalSizeInBytes = allItems.reduce((sum, item) => sum + item.sizeInBytes, 0);

  const result = {
    totalSizeInBytes,
    items: allItems,
  };
  return result;
}
