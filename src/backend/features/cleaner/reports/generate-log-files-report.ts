import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { cleanerCtx } from '../cleaner.config';
import { pathsToClean } from './paths-to-clean';
import { generateReport } from './generate-report';

export async function generateLogFilesReport() {
  const promises = [
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.logs.systemLogs,
      customFileFilter: CleanerModule.logFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: pathsToClean.localAppData,
      subPath: 'logs',
      customFileFilter: CleanerModule.logFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: pathsToClean.roamingAppData,
      subPath: 'logs',
      customFileFilter: CleanerModule.logFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: pathsToClean.programData,
      subPath: 'logs',
      customFileFilter: CleanerModule.logFileFilter,
    }),
  ];

  return await generateReport({ promises, sectionKey: 'logFiles' });
}
