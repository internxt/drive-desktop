import { CleanableItem, CleanerSection } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { getWebStorageFilePaths } from './get-web-storage-file-paths';
import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { cleanerCtx } from '@/apps/renderer/pages/Settings/Cleaner/cleaner.config';

export async function generateWebStorageFileReport(): Promise<CleanerSection> {
  const paths = getWebStorageFilePaths();
  let allItems: CleanableItem[] = [];

  const scanSubSectionPromises = [
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      absolutePath: paths.chrome.cookies,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      absolutePath: paths.chrome.localStorage,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
    CleanerModule.scanFirefoxProfiles({ ctx: cleanerCtx, firefoxProfilesDir: paths.firefox }),
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      absolutePath: paths.edge.cookies,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      absolutePath: paths.edge.localStorage,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
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
