import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { generateWindowsSpecificFileReport } from './generate-windows-specific-file-report';
import { pathsToClean } from './paths-to-clean';
import * as generateReportModule from './generate-report';
import { calls, call, partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('generateWindowsSpecificFileReport', () => {
  const scanDirectoryMock = partialSpyOn(CleanerModule, 'scanDirectory');
  const generateReportMock = partialSpyOn(generateReportModule, 'generateReport');

  it('should scan Windows Update cache and Prefetch directories and generate a report', async () => {
    // Given
    scanDirectoryMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    // When
    await generateWindowsSpecificFileReport();
    // Then
    calls(scanDirectoryMock).toMatchObject([
      {
        dirPath: pathsToClean.windowsSpecific.windowsUpdateCache,
        customFileFilter: CleanerModule.isSafeWebBrowserFile,
      },
      {
        dirPath: pathsToClean.windowsSpecific.prefetch,
        customFileFilter: CleanerModule.isSafeWebBrowserFile,
      },
    ]);

    call(generateReportMock).toMatchObject({
      promises: [expect.any(Promise), expect.any(Promise)],
    });
  });
});
