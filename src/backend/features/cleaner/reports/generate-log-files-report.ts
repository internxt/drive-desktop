import { CleanableItem, CleanerSection } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { getFilePathsToClean } from './get-file-paths-to-clean';
import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { cleanerCtx } from '../cleaner.config';

export async function generateLogFilesReport(): Promise<CleanerSection> {
  const pathsToClean = getFilePathsToClean();
  let allItems: CleanableItem[] = [];

  const scanSubSectionPromises = [
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.logs.systemLogs,
      customFileFilter: CleanerModule.logFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: pathsToClean.localAppData,
      subPath: 'log',
      customFileFilter: CleanerModule.logFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: pathsToClean.roamingAppData,
      subPath: 'log',
      customFileFilter: CleanerModule.logFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: pathsToClean.programData,
      subPath: 'log',
      customFileFilter: CleanerModule.logFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: pathsToClean.logs.userProfileLogs,
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
