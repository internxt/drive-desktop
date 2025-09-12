import { CleanableItem, CleanerSection } from '../cleaner.types';
import { scanDirectory } from '../scan-directory';
import { scanSingleFile } from '../scan-single-file';
import { scanSubDirectory } from '../scan-subdirectory';
import { getLogfilesPaths } from './get-log-files-paths';
import { logFileFilter } from './utils/is-safe-log-file';

/**
 * Generates a report for Log files section by scanning various logs directories
 * @returns Promise<CleanerSection> Report containing all log files
 */
export async function generateLogsFilesReport(): Promise<CleanerSection> {
  const paths = getLogfilesPaths();
  const allItems: CleanableItem[] = [];

  const scanSubSectionPromises = [
    /**
     * Scan ~/.local/share/[AppName]/logs/ directories
     */
    scanSubDirectory({
      baseDir: paths.localShareLogs,
      subPath: 'logs',
      customFileFilter: logFileFilter,
    }),
    /**
     * Scan ~/.local/share/[AppName]/log/ directories
     */
    scanSubDirectory({
      baseDir: paths.localShareLogs,
      subPath: 'log',
      customFileFilter: logFileFilter,
    }),
    /**
     * Scan /var/log directories
     */
    scanDirectory({
      dirPath: paths.varLogDir,
      customFileFilter: logFileFilter,
    }),
    /**
     * Scan ~/.xsession-errors file
     */
    scanSingleFile(paths.xsessionErrorsFile),
  ];
  const results = await Promise.allSettled(scanSubSectionPromises);

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  });

  const totalSizeInBytes = allItems.reduce(
    (sum, item) => sum + item.sizeInBytes,
    0
  );

  return {
    totalSizeInBytes,
    items: allItems,
  };
}
