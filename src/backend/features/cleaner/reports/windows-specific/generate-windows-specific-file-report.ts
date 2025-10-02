import { CleanableItem, CleanerSection } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { getWindowsSpecificPaths } from './get-windows-specific-file-path';
import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { cleanerCtx } from '@/apps/renderer/pages/Settings/Cleaner/cleaner.config';

export async function generateWindowsSpecificFileReport(): Promise<CleanerSection> {
  const paths = getWindowsSpecificPaths();
  let allItems: CleanableItem[] = [];

  const scanSubSectionPromises = [
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      absolutePath: paths.windowsUpdateCache,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      absolutePath: paths.prefetch,
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
