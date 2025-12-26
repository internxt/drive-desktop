import { generateCleanerReport } from './generate-cleaner-report';
import * as generateAppCacheReportModule from './generate-app-cache-report';
import * as generateLogFilesReportModule from './generate-log-files-report';
import * as generateWebStorageFileReportModule from './generate-web-storage-files-report';
import * as generateWebCacheReportModule from './generate-web-cache-report';
import * as generateWindowsSpecificFileReportModule from './generate-windows-specific-file-report';
import { calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('generateCleanerReport', () => {
  const generateAppCacheReportMock = partialSpyOn(generateAppCacheReportModule, 'generateAppCacheReport');
  const generateLogFilesReportMock = partialSpyOn(generateLogFilesReportModule, 'generateLogFilesReport');
  const generateWebStorageFileReportMock = partialSpyOn(generateWebStorageFileReportModule, 'generateWebStorageFileReport');
  const generateWebCacheReportMock = partialSpyOn(generateWebCacheReportModule, 'generateWebCacheReport');
  const generateWindowsSpecificFileReportMock = partialSpyOn(generateWindowsSpecificFileReportModule, 'generateWindowsSpecificFileReport');

  it('should generate a complete cleaner report when all sections succeed', async () => {
    // When
    await generateCleanerReport({ force: true });
    // Then
    calls(generateAppCacheReportMock).toHaveLength(1);
    calls(generateLogFilesReportMock).toHaveLength(1);
    calls(generateWebStorageFileReportMock).toHaveLength(1);
    calls(generateWebCacheReportMock).toHaveLength(1);
    calls(generateWindowsSpecificFileReportMock).toHaveLength(1);

    calls(loggerMock.debug).toMatchObject([
      { msg: 'Starting cleaner report generation...' },
      { msg: 'Cleaner report generation Finished' },
    ]);
    calls(loggerMock.error).toHaveLength(0);
  });

  it('should use cached report when refreshReport is false and report exists', async () => {
    // Given
    await generateCleanerReport({ force: true });
    // When
    await generateCleanerReport({ force: false });
    // Then
    calls(generateAppCacheReportMock).toHaveLength(1);
    calls(generateLogFilesReportMock).toHaveLength(1);
    calls(generateWebStorageFileReportMock).toHaveLength(1);
    calls(generateWebCacheReportMock).toHaveLength(1);
    calls(generateWindowsSpecificFileReportMock).toHaveLength(1);
  });

  it('should regenerate report when refreshReport is true even if cached report exists', async () => {
    // Given
    await generateCleanerReport({ force: true });
    // When
    await generateCleanerReport({ force: true });
    // Then
    calls(generateAppCacheReportMock).toHaveLength(2);
    calls(generateLogFilesReportMock).toHaveLength(2);
    calls(generateWebStorageFileReportMock).toHaveLength(2);
    calls(generateWebCacheReportMock).toHaveLength(2);
    calls(generateWindowsSpecificFileReportMock).toHaveLength(2);
  });

  it('should handle rejected promises with fallback sections and log errors', async () => {
    // Given
    const error = new Error('Failed to generate section');
    generateAppCacheReportMock.mockRejectedValueOnce(error);
    generateWebCacheReportMock.mockRejectedValueOnce(error);
    // When
    await generateCleanerReport({ force: true });
    // Then
    calls(loggerMock.error).toHaveLength(2);
  });

  it('should handle all sections failing and return fallback report', async () => {
    // Given
    const error = new Error('Critical failure');
    generateAppCacheReportMock.mockRejectedValueOnce(error);
    generateLogFilesReportMock.mockRejectedValueOnce(error);
    generateWebStorageFileReportMock.mockRejectedValueOnce(error);
    generateWebCacheReportMock.mockRejectedValueOnce(error);
    generateWindowsSpecificFileReportMock.mockRejectedValueOnce(error);
    // When
    const result = await generateCleanerReport({ force: true });
    // Then
    expect(result).toStrictEqual({
      appCache: { totalSizeInBytes: 0, items: [] },
      logFiles: { totalSizeInBytes: 0, items: [] },
      webStorage: { totalSizeInBytes: 0, items: [] },
      webCache: { totalSizeInBytes: 0, items: [] },
      platformSpecific: { totalSizeInBytes: 0, items: [] },
    });
    calls(loggerMock.error).toHaveLength(5);
  });
});
