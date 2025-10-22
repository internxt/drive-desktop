import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { generateWebStorageFileReport } from './generate-web-storage-files-report';
import { pathsToClean } from './paths-to-clean';
import { calls, call, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as generateReportModule from './generate-report';

describe('generateWebStorageFileReport', () => {
  const scanDirectoryMock = partialSpyOn(CleanerModule, 'scanDirectory');
  const scanFirefoxProfilesMock = partialSpyOn(CleanerModule, 'scanFirefoxProfiles');
  const generateReportMock = partialSpyOn(generateReportModule, 'generateReport');

  it('should scan Chrome, Firefox, and Edge web storage directories and generate a report', async () => {
    // Given
    scanDirectoryMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    scanFirefoxProfilesMock.mockResolvedValueOnce([]);
    // When
    await generateWebStorageFileReport();
    // Then
    calls(scanDirectoryMock).toMatchObject([
      {
        dirPath: pathsToClean.webStorage.chrome.cookies,
        customFileFilter: CleanerModule.isSafeWebBrowserFile,
      },
      {
        dirPath: pathsToClean.webStorage.chrome.localStorage,
        customFileFilter: CleanerModule.isSafeWebBrowserFile,
      },
      {
        dirPath: pathsToClean.webStorage.edge.cookies,
        customFileFilter: CleanerModule.isSafeWebBrowserFile,
      },
      {
        dirPath: pathsToClean.webStorage.edge.localStorage,
        customFileFilter: CleanerModule.isSafeWebBrowserFile,
      },
    ]);

    call(scanFirefoxProfilesMock).toMatchObject({
      firefoxProfilesDir: pathsToClean.webStorage.firefox,
    });

    call(generateReportMock).toMatchObject({
      promises: expect.arrayContaining([
        expect.any(Promise),
        expect.any(Promise),
        expect.any(Promise),
        expect.any(Promise),
        expect.any(Promise),
      ]),
    });
  });
});
