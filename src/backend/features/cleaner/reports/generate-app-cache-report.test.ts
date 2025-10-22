import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { generateAppCacheReport } from './generate-app-cache-report';
import { pathsToClean } from './paths-to-clean';
import * as generateReportModule from './generate-report';
import { calls, call, partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('generateAppCacheReport', () => {
  const scanDirectoryMock = partialSpyOn(CleanerModule, 'scanDirectory');
  const scanSubDirectoryMock = partialSpyOn(CleanerModule, 'scanSubDirectory');
  const generateReportMock = partialSpyOn(generateReportModule, 'generateReport');

  it('should scan temp directories and cache subdirectories and generate a report', async () => {
    // Given
    scanDirectoryMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    scanSubDirectoryMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    // When
    await generateAppCacheReport();
    // Then
    calls(scanDirectoryMock).toMatchObject([
      {
        dirPath: pathsToClean.cache.tempDir,
        customFileFilter: CleanerModule.appCacheFileFilter,
        customDirectoryFilter: CleanerModule.isDirectoryWebBrowserRelated,
      },
      {
        dirPath: pathsToClean.cache.systemTmpDir,
        customFileFilter: CleanerModule.appCacheFileFilter,
      },
    ]);

    calls(scanSubDirectoryMock).toMatchObject([
      {
        baseDir: pathsToClean.localAppData,
        customFileFilter: CleanerModule.appCacheFileFilter,
        customDirectoryFilter: CleanerModule.isDirectoryWebBrowserRelated,
      },
      {
        baseDir: pathsToClean.roamingAppData,
        customFileFilter: CleanerModule.appCacheFileFilter,
        customDirectoryFilter: CleanerModule.isDirectoryWebBrowserRelated,
      },
    ]);

    call(generateReportMock).toMatchObject({
      promises: [expect.any(Promise), expect.any(Promise), expect.any(Promise), expect.any(Promise)],
    });
  });
});
