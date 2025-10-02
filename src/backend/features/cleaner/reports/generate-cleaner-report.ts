import { logger } from '@internxt/drive-desktop-core/build/backend';
import { CleanerSection } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { generateAppCacheReport } from './app-cache/generate-app-cache-report';
import { generateLogsFilesReport } from './log-files/generate-logs-file-repot';
import { generateWebStorageFileReport } from './web-storage-files/generate-web-storage-file-report';
import { generateWebCacheReport } from './web-cache/generate-web-cache-report';
import { WindowsCleanerReport } from '@/apps/renderer/pages/Settings/Cleaner/cleaner.types';
import { generateWindowsSpecificFileReport } from './windows-specific/generate-windows-specific-file-report';

export let storedCleanerReport: WindowsCleanerReport | null = null;

export function clearCleanerReportCache(): void {
  storedCleanerReport = null;
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

export async function generateCleanerReport(refreshReport = false) {
  if (!refreshReport && storedCleanerReport) return storedCleanerReport;

  try {
    logger.debug({ msg: 'Starting cleaner report generation...' });

    const [appCache, logfiles, webStorage, webCache, windowsSpecific] = await Promise.allSettled([
      generateAppCacheReport(),
      generateLogsFilesReport(),
      generateWebStorageFileReport(),
      generateWebCacheReport(),
      generateWindowsSpecificFileReport(),
    ]);

    const cleanerReport = {
      appCache: getCleanerSectionOrFallback(appCache),
      logFiles: getCleanerSectionOrFallback(logfiles),
      trash: { totalSizeInBytes: 0, items: [] },
      webStorage: getCleanerSectionOrFallback(webStorage),
      webCache: getCleanerSectionOrFallback(webCache),
      windowsSpecific: getCleanerSectionOrFallback(windowsSpecific),
    };

    logger.debug({ tag: 'CLEANER', msg: 'Cleaner report generation Finished' });
    storedCleanerReport = cleanerReport;
    return storedCleanerReport;
  } catch (error) {
    logger.error({ tag: 'CLEANER', msg: 'Error generating cleaner report:', error });
    return {
      appCache: { totalSizeInBytes: 0, items: [] },
      logFiles: { totalSizeInBytes: 0, items: [] },
      trash: { totalSizeInBytes: 0, items: [] },
      webStorage: { totalSizeInBytes: 0, items: [] },
      webCache: { totalSizeInBytes: 0, items: [] },
      windowsSpecific: { totalSizeInBytes: 0, items: [] },
    };
  }
}
