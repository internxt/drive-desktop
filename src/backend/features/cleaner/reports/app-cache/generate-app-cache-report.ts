import { CleanerSection, CleanableItem } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { cleanerCtx } from '@/apps/renderer/pages/Settings/Cleaner/cleaner.config';
import { getWindowsAppCachePaths } from './get-app-cache-paths';

export async function generateAppCacheReport(): Promise<CleanerSection> {
  const appCachePaths = getWindowsAppCachePaths();
  let allItems: CleanableItem[] = [];

  const scanSubSectionPromises = [
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      absolutePath: appCachePaths.tmpDir,
      customFileFilter: CleanerModule.appCacheFileFilter,
      customDirectoryFilter: CleanerModule.isDirectoryWebBrowserRelated,
    }),

    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      absolutePath: appCachePaths.systemTmpDir,
      customFileFilter: CleanerModule.appCacheFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: appCachePaths.localCache,
      subPath: 'cache',
      customDirectoryFilter: CleanerModule.isDirectoryWebBrowserRelated,
      customFileFilter: CleanerModule.appCacheFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: appCachePaths.roamingCache,
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
