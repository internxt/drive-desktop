import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { cleanerCtx } from '../cleaner.config';
import { pathsToClean } from './paths-to-clean';
import { generateReport } from './generate-report';

export async function generateWebCacheReport() {
  const promises = [
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.webCache.chrome,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),

    CleanerModule.scanFirefoxCacheProfiles({ ctx: cleanerCtx, firefoxCacheDir: pathsToClean.webCache.firefox }),

    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.webCache.edge,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),

    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.webCache.edgeIECache,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
  ];

  return await generateReport({ promises, sectionKey: 'webCache' });
}
