import { CleanableItem, CleanerSection } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { getLogsFilePaths } from './get-logs-file-paths';
import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { cleanerCtx } from '@/apps/renderer/pages/Settings/Cleaner/cleaner.config';

export async function generateLogsFilesReport(): Promise<CleanerSection> {
  const paths = getLogsFilePaths();
  let allItems: CleanableItem[] = [];

  const scanSubSectionPromises = [
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      absolutePath: paths.systemLogs,
      customFileFilter: CleanerModule.logFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: paths.localLogs,
      subPath: 'log',
      customFileFilter: CleanerModule.logFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: paths.roamingLogs,
      subPath: 'log',
      customFileFilter: CleanerModule.logFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: paths.programDataLogs,
      subPath: 'log',
      customFileFilter: CleanerModule.logFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: paths.userProfileLogs,
      subPath: 'log',
      customFileFilter: CleanerModule.logFileFilter,
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
