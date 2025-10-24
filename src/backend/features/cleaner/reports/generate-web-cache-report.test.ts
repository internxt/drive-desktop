import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { generateWebCacheReport } from './generate-web-cache-report';
import { pathsToClean } from './paths-to-clean';
import * as generateReportModule from './generate-report';
import { calls, call, partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('generateWebCacheReport', () => {
  const scanDirectoryMock = partialSpyOn(CleanerModule, 'scanDirectory');
  const scanFirefoxCacheProfilesMock = partialSpyOn(CleanerModule, 'scanFirefoxCacheProfiles');
  const generateReportMock = partialSpyOn(generateReportModule, 'generateReport');

  it('should scan Chrome, Firefox, Edge, and Edge IE cache directories and generate a report', async () => {
    // Given
    scanDirectoryMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    scanFirefoxCacheProfilesMock.mockResolvedValueOnce([]);
    // When
    await generateWebCacheReport();
    // Then
    calls(scanDirectoryMock).toMatchObject([
      {
        dirPath: pathsToClean.webCache.chrome,
        customFileFilter: CleanerModule.isSafeWebBrowserFile,
      },
      {
        dirPath: pathsToClean.webCache.edge,
        customFileFilter: CleanerModule.isSafeWebBrowserFile,
      },
      {
        dirPath: pathsToClean.webCache.edgeIECache,
        customFileFilter: CleanerModule.isSafeWebBrowserFile,
      },
    ]);

    call(scanFirefoxCacheProfilesMock).toMatchObject({
      firefoxCacheDir: pathsToClean.webCache.firefox,
    });

    call(generateReportMock).toMatchObject({
      promises: [expect.any(Promise), expect.any(Promise), expect.any(Promise), expect.any(Promise)],
    });
  });
});
