import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { cleanerCtx } from '../cleaner.config';
import { generateReport } from './generate-report';
import { pathsToClean } from './paths-to-clean';

export async function generateAppCacheReport() {
  const promises = [
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.cache.tempDir,
      customFileFilter: CleanerModule.appCacheFileFilter,
      customDirectoryFilter: CleanerModule.isDirectoryWebBrowserRelated,
    }),

    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.cache.systemTmpDir,
      customFileFilter: CleanerModule.appCacheFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: pathsToClean.localAppData,
      subPath: 'cache',
      customDirectoryFilter: CleanerModule.isDirectoryWebBrowserRelated,
      customFileFilter: CleanerModule.appCacheFileFilter,
    }),

    CleanerModule.scanSubDirectory({
      ctx: cleanerCtx,
      baseDir: pathsToClean.roamingAppData,
      subPath: 'cache',
      customDirectoryFilter: CleanerModule.isDirectoryWebBrowserRelated,
      customFileFilter: CleanerModule.appCacheFileFilter,
    }),
  ];

  return await generateReport({ promises, sectionKey: 'appCache' });
}
