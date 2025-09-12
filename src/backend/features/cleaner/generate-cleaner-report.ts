import { logger } from '@internxt/drive-desktop-core/build/backend';
import { CleanerReport, CleanerSection } from './cleaner.types';
import { generateAppCacheReport } from './app-cache/generate-app-cache-report';
import { generateLogsFilesReport } from './log-files/generate-logs-files-report';
import { generateTrashFilesReport } from './trash-files/generate-trash-files-report';
import { generateWebStorageFilesReport } from './web-storage-files/generate-web-storage-files-report';
import { generateWebCacheReport } from './web-cache/generate-web-cache-report';

export let storedCleanerReport: CleanerReport | null = null;

export function clearCleanerReportCache(): void {
  storedCleanerReport = null;
}

function getCleanerSectionOrFallback(
  result: PromiseSettledResult<CleanerSection>
): CleanerSection {
  if (result.status === 'fulfilled') {
    return result.value;
  } else {
    logger.error({
      msg: 'Cleaner section failed with reason:',
      error: result.reason,
    });
    return { totalSizeInBytes: 0, items: [] };
  }
}

export async function generateCleanerReport(
  refreshReport = false
): Promise<CleanerReport> {
  if (!refreshReport && storedCleanerReport) return storedCleanerReport;

  try {
    logger.debug({ msg: 'Starting cleaner report generation...' });

    const [appCache, logfiles, trash, webStorage, webCache] =
      await Promise.allSettled([
        generateAppCacheReport(),
        generateLogsFilesReport(),
        generateTrashFilesReport(),
        generateWebStorageFilesReport(),
        generateWebCacheReport(),
      ]);
    const cleanerReport = {
      appCache: getCleanerSectionOrFallback(appCache),
      logFiles: getCleanerSectionOrFallback(logfiles),
      trash: getCleanerSectionOrFallback(trash),
      webStorage: getCleanerSectionOrFallback(webStorage),
      webCache: getCleanerSectionOrFallback(webCache),
    };
    logger.debug({ msg: 'Cleaner report generation Finished' });
    storedCleanerReport = cleanerReport;
    return storedCleanerReport;
  } catch (error) {
    logger.error({ msg: 'Error generating cleaner report:', error });
    return {
      appCache: { totalSizeInBytes: 0, items: [] },
      logFiles: { totalSizeInBytes: 0, items: [] },
      trash: { totalSizeInBytes: 0, items: [] },
      webStorage: { totalSizeInBytes: 0, items: [] },
      webCache: { totalSizeInBytes: 0, items: [] },
    };
  }
}
