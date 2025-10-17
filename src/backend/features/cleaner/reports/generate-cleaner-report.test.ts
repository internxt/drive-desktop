import { generateCleanerReport } from './generate-cleaner-report';
import * as generateAppCacheReportModule from './generate-app-cache-report';
import * as generateLogFilesReportModule from './generate-log-files-report';
import * as generateWebStorageFileReportModule from './generate-web-storage-files-report';
import * as generateWebCacheReportModule from './generate-web-cache-report';
import * as generateWindowsSpecificFileReportModule from './generate-windows-specific-file-report';
import { calls, call, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('generateCleanerReport', () => {
  const generateAppCacheReportMock = partialSpyOn(generateAppCacheReportModule, 'generateAppCacheReport');
  const generateLogFilesReportMock = partialSpyOn(generateLogFilesReportModule, 'generateLogFilesReport');
  const generateWebStorageFileReportMock = partialSpyOn(generateWebStorageFileReportModule, 'generateWebStorageFileReport');
  const generateWebCacheReportMock = partialSpyOn(generateWebCacheReportModule, 'generateWebCacheReport');
  const generateWindowsSpecificFileReportMock = partialSpyOn(generateWindowsSpecificFileReportModule, 'generateWindowsSpecificFileReport');

  const mockAppCacheReport = {
    totalSizeInBytes: 1024,
    items: [
      {
        fullPath: 'G:\\Users\\User\\AppData\\Local\\Temp\\cache.tmp',
        fileName: 'cache.tmp',
        sizeInBytes: 1024,
      },
    ],
  };

  const mockLogFilesReport = {
    totalSizeInBytes: 2048,
    items: [
      {
        fullPath: 'G:\\Windows Fake\\Logs\\log.log',
        fileName: 'log.log',
        sizeInBytes: 2048,
      },
    ],
  };

  const mockWebStorageReport = {
    totalSizeInBytes: 512,
    items: [
      {
        fullPath: 'G:\\Users\\User\\AppData\\Local\\Google\\Chrome\\cookies',
        fileName: 'cookies',
        sizeInBytes: 512,
      },
    ],
  };

  const mockWebCacheReport = {
    totalSizeInBytes: 4096,
    items: [
      {
        fullPath: 'G:\\Users\\User\\AppData\\Local\\Google\\Chrome\\Cache\\cache',
        fileName: 'cache',
        sizeInBytes: 4096,
      },
    ],
  };

  const mockWindowsSpecificReport = {
    totalSizeInBytes: 8192,
    items: [
      {
        fullPath: 'G:\\Windows Fake\\Prefetch\\file.pf',
        fileName: 'file.pf',
        sizeInBytes: 8192,
      },
    ],
  };

  beforeEach(() => {
    generateAppCacheReportMock.mockResolvedValue(mockAppCacheReport);
    generateLogFilesReportMock.mockResolvedValue(mockLogFilesReport);
    generateWebStorageFileReportMock.mockResolvedValue(mockWebStorageReport);
    generateWebCacheReportMock.mockResolvedValue(mockWebCacheReport);
    generateWindowsSpecificFileReportMock.mockResolvedValue(mockWindowsSpecificReport);
  });

  it('should generate a complete cleaner report when all sections succeed', async () => {
    // When
    const result = await generateCleanerReport(true);
    // Then
    expect(result).toEqual({
      appCache: mockAppCacheReport,
      logFiles: mockLogFilesReport,
      webStorage: mockWebStorageReport,
      webCache: mockWebCacheReport,
      platformSpecific: mockWindowsSpecificReport,
    });

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
    await generateCleanerReport(true);
    // When
    const result = await generateCleanerReport(false);
    // Then
    expect(result).toMatchObject({
      appCache: mockAppCacheReport,
      logFiles: mockLogFilesReport,
      webStorage: mockWebStorageReport,
      webCache: mockWebCacheReport,
      platformSpecific: mockWindowsSpecificReport,
    });

    call(generateAppCacheReportMock).toBeUndefined();
    call(generateLogFilesReportMock).toBeUndefined();
    call(generateWebStorageFileReportMock).toBeUndefined();
    call(generateWebCacheReportMock).toBeUndefined();
    call(generateWindowsSpecificFileReportMock).toBeUndefined();
  });

  it('should regenerate report when refreshReport is true even if cached report exists', async () => {
    // Given
    await generateCleanerReport(true);
    // When
    const result = await generateCleanerReport(true);
    // Then
    expect(result).toBeDefined();
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
    const result = await generateCleanerReport(true);
    // Then
    expect(result.appCache).toStrictEqual({ totalSizeInBytes: 0, items: [] });
    expect(result.logFiles).toStrictEqual(mockLogFilesReport);
    expect(result.webStorage).toStrictEqual(mockWebStorageReport);
    expect(result.webCache).toStrictEqual({ totalSizeInBytes: 0, items: [] });
    expect(result.platformSpecific).toStrictEqual(mockWindowsSpecificReport);

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
    const result = await generateCleanerReport(true);
    // Then
    expect(result).toStrictEqual({
      appCache: { totalSizeInBytes: 0, items: [] },
      logFiles: { totalSizeInBytes: 0, items: [] },
      webStorage: { totalSizeInBytes: 0, items: [] },
      webCache: { totalSizeInBytes: 0, items: [] },
      platformSpecific: { totalSizeInBytes: 0, items: [] },
    });
  });
});
