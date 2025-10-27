import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { generateLogFilesReport } from './generate-log-files-report';
import { pathsToClean } from './paths-to-clean';
import { calls, call, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as generateReportModule from './generate-report';

describe('generateLogFilesReport', () => {
  const scanDirectoryMock = partialSpyOn(CleanerModule, 'scanDirectory');
  const scanSubDirectoryMock = partialSpyOn(CleanerModule, 'scanSubDirectory');
  const generateReportMock = partialSpyOn(generateReportModule, 'generateReport');

  it('should scan system logs and subdirectories for log files and generate a report', async () => {
    // Given
    scanDirectoryMock.mockResolvedValueOnce([]);

    scanSubDirectoryMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    // When
    await generateLogFilesReport();
    // Then
    call(scanDirectoryMock).toMatchObject({
      dirPath: pathsToClean.logs.systemLogs,
      customFileFilter: CleanerModule.logFileFilter,
    });

    calls(scanSubDirectoryMock).toMatchObject([
      {
        baseDir: pathsToClean.localAppData,
        customFileFilter: CleanerModule.logFileFilter,
      },
      {
        baseDir: pathsToClean.roamingAppData,
        customFileFilter: CleanerModule.logFileFilter,
      },
      {
        baseDir: pathsToClean.programData,
        customFileFilter: CleanerModule.logFileFilter,
      },
    ]);

    call(generateReportMock).toMatchObject({
      promises: expect.arrayContaining([expect.any(Promise), expect.any(Promise), expect.any(Promise), expect.any(Promise)]),
    });
  });
});
