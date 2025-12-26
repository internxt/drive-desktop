import { logger } from '@internxt/drive-desktop-core/build/backend';
import { CleanerReport, CleanerSection } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { generateAppCacheReport } from './generate-app-cache-report';
import { generateLogFilesReport } from './generate-log-files-report';
import { generateWebStorageFileReport } from './generate-web-storage-files-report';
import { generateWebCacheReport } from './generate-web-cache-report';
import { generateWindowsSpecificFileReport } from './generate-windows-specific-file-report';

let storedCleanerReport: CleanerReport | null = null;

export function getStoredCleanerReport(): CleanerReport | null {
  return storedCleanerReport;
}

function getCleanerSectionOrFallback(result: PromiseSettledResult<CleanerSection>) {
  if (result.status === 'fulfilled') {
    return result.value;
  } else {
    logger.error({
      tag: 'CLEANER',
      msg: 'Cleaner section failed with reason:',
      error: result.reason,
    });
    return { totalSizeInBytes: 0, items: [] };
  }
}

export async function generateCleanerReport({ force }: { force: boolean }) {
  if (!force && storedCleanerReport) return storedCleanerReport;

  try {
    logger.debug({ msg: 'Starting cleaner report generation...' });

    const [appCache, logfiles, webStorage, webCache, windowsSpecific] = await Promise.allSettled([
      generateAppCacheReport(),
      generateLogFilesReport(),
      generateWebStorageFileReport(),
      generateWebCacheReport(),
      generateWindowsSpecificFileReport(),
    ]);

    const cleanerReport = {
      appCache: getCleanerSectionOrFallback(appCache),
      logFiles: getCleanerSectionOrFallback(logfiles),
      webStorage: getCleanerSectionOrFallback(webStorage),
      webCache: getCleanerSectionOrFallback(webCache),
      platformSpecific: getCleanerSectionOrFallback(windowsSpecific),
    };

    logger.debug({ tag: 'CLEANER', msg: 'Cleaner report generation Finished' });
    storedCleanerReport = cleanerReport as Partial<CleanerReport> as CleanerReport;
    return storedCleanerReport;
  } catch (error) {
    logger.error({ tag: 'CLEANER', msg: 'Error generating cleaner report:', error });
    return {
      appCache: { totalSizeInBytes: 0, items: [] },
      logFiles: { totalSizeInBytes: 0, items: [] },
      webStorage: { totalSizeInBytes: 0, items: [] },
      webCache: { totalSizeInBytes: 0, items: [] },
      platformSpecific: { totalSizeInBytes: 0, items: [] },
    };
  }
}
