import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { cleanerCtx } from '../cleaner.config';
import { pathsToClean } from './paths-to-clean';
import { generateReport } from './generate-report';

export async function generateWindowsSpecificFileReport() {
  const promises = [
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.windowsSpecific.windowsUpdateCache,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.windowsSpecific.prefetch,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
  ];

  return await generateReport({ promises });
}
