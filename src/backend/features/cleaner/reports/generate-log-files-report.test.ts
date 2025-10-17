import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { generateLogFilesReport } from './generate-log-files-report';
import { cleanerCtx } from '../cleaner.config';
import { pathsToClean } from './paths-to-clean';
import * as generateReportModule from './generate-report';
import { calls, call, partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('generateLogFilesReport', () => {
  const scanDirectoryMock = partialSpyOn(CleanerModule, 'scanDirectory');
  const scanSubDirectoryMock = partialSpyOn(CleanerModule, 'scanSubDirectory');
  const generateReportMock = partialSpyOn(generateReportModule, 'generateReport');

  const mockCleanableItems = [
    {
      fullPath: 'G:\\Windows Fake\\Logs\\log1.log',
      fileName: 'log1.log',
      sizeInBytes: 1024,
    },
    {
      fullPath: 'G:\\Users\\User\\AppData\\Local\\log\\app.log',
      fileName: 'app.log',
      sizeInBytes: 2048,
    },
    {
      fullPath: 'G:\\Users\\User\\AppData\\Roaming\\log\\service.log',
      fileName: 'service.log',
      sizeInBytes: 4096,
    },
    {
      fullPath: 'G:\\ProgramData\\log\\system.log',
      fileName: 'system.log',
      sizeInBytes: 512,
    },
  ];

  const mockReport = {
    totalSizeInBytes: 15872,
    items: mockCleanableItems,
  };

  beforeEach(() => {
    generateReportMock.mockResolvedValue(mockReport);
  });

  it('should scan system logs and subdirectories for log files and generate a report', async () => {
    // Given
    const systemLogsItems = [mockCleanableItems[0]];
    const localAppDataLogsItems = [mockCleanableItems[1]];
    const roamingAppDataLogsItems = [mockCleanableItems[2]];
    const programDataLogsItems = [mockCleanableItems[3]];

    scanDirectoryMock.mockResolvedValueOnce(systemLogsItems);

    scanSubDirectoryMock
      .mockResolvedValueOnce(localAppDataLogsItems)
      .mockResolvedValueOnce(roamingAppDataLogsItems)
      .mockResolvedValueOnce(programDataLogsItems);
    // When
    const result = await generateLogFilesReport();
    // Then
    calls(scanDirectoryMock).toHaveLength(1);
    call(scanDirectoryMock).toMatchObject({
      ctx: cleanerCtx,
      dirPath: pathsToClean.logs.systemLogs,
      customFileFilter: CleanerModule.logFileFilter,
    });

    calls(scanSubDirectoryMock).toHaveLength(3);
    calls(scanSubDirectoryMock).toMatchObject([
      {
        baseDir: pathsToClean.localAppData,
      },
      {
        baseDir: pathsToClean.roamingAppData,
      },
      {
        baseDir: pathsToClean.programData,
      },
    ]);

    calls(generateReportMock).toHaveLength(1);
    call(generateReportMock).toMatchObject({
      promises: expect.arrayContaining([expect.any(Promise), expect.any(Promise), expect.any(Promise), expect.any(Promise)]),
    });

    expect(result).toStrictEqual(mockReport);
  });
});
