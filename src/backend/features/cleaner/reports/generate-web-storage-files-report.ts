import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { cleanerCtx } from '../cleaner.config';
import { generateReport } from './generate-report';
import { pathsToClean } from './paths-to-clean';

export async function generateWebStorageFileReport() {
  const promises = [
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.webStorage.chrome.cookies,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.webStorage.chrome.localStorage,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
    CleanerModule.scanFirefoxProfiles({ ctx: cleanerCtx, firefoxProfilesDir: pathsToClean.webStorage.firefox }),
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.webStorage.edge.cookies,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
    CleanerModule.scanDirectory({
      ctx: cleanerCtx,
      dirPath: pathsToClean.webStorage.edge.localStorage,
      customFileFilter: CleanerModule.isSafeWebBrowserFile,
    }),
  ];

  return await generateReport({ promises, sectionKey: 'webStorage' });
}
