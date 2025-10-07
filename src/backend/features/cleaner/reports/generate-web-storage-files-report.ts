import { CleanableItem, CleanerSection } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { getFilePathsToClean } from './get-file-paths-to-clean';
import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { cleanerCtx } from '../cleaner.config';

export async function generateWebStorageFileReport(): Promise<CleanerSection> {
  const pathsToClean = getFilePathsToClean();
  let allItems: CleanableItem[] = [];

  const scanSubSectionPromises = [
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.webStorage.chrome.cookies,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.webStorage.chrome.localStorage,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
    CleanerModule.scanFirefoxProfiles({ ctx: cleanerCtx, firefoxProfilesDir: pathsToClean.webStorage.firefox }),
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.webStorage.edge.cookies,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.webStorage.edge.localStorage,
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
