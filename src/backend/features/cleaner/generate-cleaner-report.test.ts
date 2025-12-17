import { generateCleanerReport, clearCleanerReportCache } from './generate-cleaner-report';
import { generateAppCacheReport } from './app-cache/generate-app-cache-report';
import { generateLogsFilesReport } from './log-files/generate-logs-files-report';
import { generateTrashFilesReport } from './trash-files/generate-trash-files-report';
import { generateWebStorageFilesReport } from './web-storage-files/generate-web-storage-files-report';
import { generateWebCacheReport } from './web-cache/generate-web-cache-report';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { CleanerSection, CleanerReport } from './cleaner.types';

// Mock all the section generators
vi.mock('./app-cache/generate-app-cache-report', () => ({
  generateAppCacheReport: vi.fn(),
}));
vi.mock('./log-files/generate-logs-files-report', () => ({
  generateLogsFilesReport: vi.fn(),
}));
vi.mock('./trash-files/generate-trash-files-report', () => ({
  generateTrashFilesReport: vi.fn(),
}));
vi.mock('./web-storage-files/generate-web-storage-files-report', () => ({
  generateWebStorageFilesReport: vi.fn(),
}));
vi.mock('./web-cache/generate-web-cache-report', () => ({
  generateWebCacheReport: vi.fn(),
}));
vi.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

const mockedGenerateAppCacheReport = vi.mocked(generateAppCacheReport);
const mockedGenerateLogsFilesReport = vi.mocked(generateLogsFilesReport);
const mockedGenerateTrashFilesReport = vi.mocked(generateTrashFilesReport);
const mockedGenerateWebStorageFilesReport = vi.mocked(generateWebStorageFilesReport);
const mockedGenerateWebCacheReport = vi.mocked(generateWebCacheReport);
const mockedLogger = vi.mocked(logger);

describe('generateCleanerReport', () => {
  // Mock section data
  const mockAppCacheSection: CleanerSection = {
    totalSizeInBytes: 1024,
    items: [
      {
        fullPath: '/tmp/cache1.txt',
        fileName: 'cache1.txt',
        sizeInBytes: 1024,
      },
    ],
  };

  const mockLogFilesSection: CleanerSection = {
    totalSizeInBytes: 2048,
    items: [
      {
        fullPath: '/var/log/test.log',
        fileName: 'test.log',
        sizeInBytes: 2048,
      },
    ],
  };

  const mockTrashSection: CleanerSection = {
    totalSizeInBytes: 512,
    items: [{ fullPath: '/trash/file.txt', fileName: 'file.txt', sizeInBytes: 512 }],
  };

  const mockWebStorageSection: CleanerSection = {
    totalSizeInBytes: 4096,
    items: [{ fullPath: '/cookies.db', fileName: 'cookies.db', sizeInBytes: 4096 }],
  };

  const mockWebCacheSection: CleanerSection = {
    totalSizeInBytes: 8192,
    items: [{ fullPath: '/cache/web.db', fileName: 'web.db', sizeInBytes: 8192 }],
  };

  const expectedCompleteReport: CleanerReport = {
    appCache: mockAppCacheSection,
    logFiles: mockLogFilesSection,
    trash: mockTrashSection,
    webStorage: mockWebStorageSection,
    webCache: mockWebCacheSection,
  };

  const emptySection: CleanerSection = { totalSizeInBytes: 0, items: [] };
  const expectedEmptyReport: CleanerReport = {
    appCache: emptySection,
    logFiles: emptySection,
    trash: emptySection,
    webStorage: emptySection,
    webCache: emptySection,
  };

  beforeEach(() => {
    clearCleanerReportCache(); // Ensure clean cache state
    vi.clearAllMocks(); // Clear all mocks before each test in this describe block

    // Reset all mocks to their default behavior
    mockedGenerateAppCacheReport.mockReset();
    mockedGenerateLogsFilesReport.mockReset();
    mockedGenerateTrashFilesReport.mockReset();
    mockedGenerateWebStorageFilesReport.mockReset();
    mockedGenerateWebCacheReport.mockReset();
  });

  afterEach(() => {
    clearCleanerReportCache();
  });

  describe('successful report generation', () => {
    beforeEach(() => {
      clearCleanerReportCache(); // Ensure clean state for this describe block
      mockedGenerateAppCacheReport.mockResolvedValue(mockAppCacheSection);
      mockedGenerateLogsFilesReport.mockResolvedValue(mockLogFilesSection);
      mockedGenerateTrashFilesReport.mockResolvedValue(mockTrashSection);
      mockedGenerateWebStorageFilesReport.mockResolvedValue(mockWebStorageSection);
      mockedGenerateWebCacheReport.mockResolvedValue(mockWebCacheSection);
    });

    it('should generate complete report when all sections succeed', async () => {
      const result = await generateCleanerReport();

      expect(result).toEqual(expectedCompleteReport);
      expect(mockedGenerateAppCacheReport).toHaveBeenCalledTimes(1);
      expect(mockedGenerateLogsFilesReport).toHaveBeenCalledTimes(1);
      expect(mockedGenerateTrashFilesReport).toHaveBeenCalledTimes(1);
      expect(mockedGenerateWebStorageFilesReport).toHaveBeenCalledTimes(1);
      expect(mockedGenerateWebCacheReport).toHaveBeenCalledTimes(1);
      expect(mockedLogger.error).not.toHaveBeenCalled();
    });

    it('should return cached report on subsequent calls without refreshReport', async () => {
      // First call generates the report
      const firstResult = await generateCleanerReport();
      expect(firstResult).toEqual(expectedCompleteReport);

      // Reset mocks to verify they aren't called again
      vi.clearAllMocks();

      // Second call should return cached result
      const secondResult = await generateCleanerReport();
      expect(secondResult).toEqual(expectedCompleteReport);
      expect(secondResult).toBe(firstResult); // Same object reference

      // Verify no section generators were called again
      expect(mockedGenerateAppCacheReport).not.toHaveBeenCalled();
      expect(mockedGenerateLogsFilesReport).not.toHaveBeenCalled();
      expect(mockedGenerateTrashFilesReport).not.toHaveBeenCalled();
      expect(mockedGenerateWebStorageFilesReport).not.toHaveBeenCalled();
      expect(mockedGenerateWebCacheReport).not.toHaveBeenCalled();
    });

    it('should regenerate report when refreshReport is true', async () => {
      // First call
      await generateCleanerReport();

      // Update mock data for second call
      const updatedAppCacheSection: CleanerSection = {
        totalSizeInBytes: 2048,
        items: [{ fullPath: '/tmp/cache2', fileName: 'cache2', sizeInBytes: 2048 }],
      };
      mockedGenerateAppCacheReport.mockResolvedValue(updatedAppCacheSection);

      // Second call with refresh
      const refreshedResult = await generateCleanerReport(true);

      expect(refreshedResult.appCache).toEqual(updatedAppCacheSection);
      expect(mockedGenerateAppCacheReport).toHaveBeenCalledTimes(2); // Called again
    });
  });

  describe('error handling for individual sections', () => {
    it('should handle single section failure gracefully', async () => {
      mockedGenerateAppCacheReport.mockRejectedValue(new Error('App cache failed'));
      mockedGenerateLogsFilesReport.mockResolvedValue(mockLogFilesSection);
      mockedGenerateTrashFilesReport.mockResolvedValue(mockTrashSection);
      mockedGenerateWebStorageFilesReport.mockResolvedValue(mockWebStorageSection);
      mockedGenerateWebCacheReport.mockResolvedValue(mockWebCacheSection);

      const result = await generateCleanerReport();

      expect(result).toEqual({
        appCache: emptySection, // Failed section returns empty
        logFiles: mockLogFilesSection,
        trash: mockTrashSection,
        webStorage: mockWebStorageSection,
        webCache: mockWebCacheSection,
      });

      expect(mockedLogger.error).toHaveBeenCalledWith({
        msg: 'Cleaner section failed with reason:',
        error: expect.any(Error),
      });
    });

    it('should handle multiple section failures gracefully', async () => {
      mockedGenerateAppCacheReport.mockRejectedValue(new Error('App cache failed'));
      mockedGenerateLogsFilesReport.mockRejectedValue(new Error('Logs failed'));
      mockedGenerateTrashFilesReport.mockResolvedValue(mockTrashSection);
      mockedGenerateWebStorageFilesReport.mockRejectedValue(new Error('Web storage failed'));
      mockedGenerateWebCacheReport.mockResolvedValue(mockWebCacheSection);

      const result = await generateCleanerReport();

      expect(result).toEqual({
        appCache: emptySection,
        logFiles: emptySection,
        trash: mockTrashSection,
        webStorage: emptySection,
        webCache: mockWebCacheSection,
      });

      expect(mockedLogger.error).toHaveBeenCalledTimes(3); // Three failures logged
    });

    it('should handle all sections failing', async () => {
      mockedGenerateAppCacheReport.mockRejectedValue(new Error('App cache failed'));
      mockedGenerateLogsFilesReport.mockRejectedValue(new Error('Logs failed'));
      mockedGenerateTrashFilesReport.mockRejectedValue(new Error('Trash failed'));
      mockedGenerateWebStorageFilesReport.mockRejectedValue(new Error('Web storage failed'));
      mockedGenerateWebCacheReport.mockRejectedValue(new Error('Web cache failed'));

      const result = await generateCleanerReport();

      expect(result).toEqual(expectedEmptyReport);
      expect(mockedLogger.error).toHaveBeenCalledTimes(5); // All failures logged
    });
  });

  describe('catastrophic error handling', () => {
    it('should handle Promise.allSettled throwing an error', async () => {
      // Mock Promise.allSettled to throw (though this is extremely unlikely)
      const originalAllSettled = Promise.allSettled;
      vi.spyOn(Promise, 'allSettled').mockRejectedValue(new Error('Promise.allSettled failed'));

      const result = await generateCleanerReport();

      expect(result).toEqual(expectedEmptyReport);
      expect(mockedLogger.error).toHaveBeenCalledWith({
        msg: 'Error generating cleaner report:',
        error: expect.any(Error),
      });

      // Restore original implementation
      Promise.allSettled = originalAllSettled;
    });
  });

  describe('caching behavior with failures', () => {
    it('should cache report even when some sections fail', async () => {
      mockedGenerateAppCacheReport.mockRejectedValue(new Error('App cache failed'));
      mockedGenerateLogsFilesReport.mockResolvedValue(mockLogFilesSection);
      mockedGenerateTrashFilesReport.mockResolvedValue(mockTrashSection);
      mockedGenerateWebStorageFilesReport.mockResolvedValue(mockWebStorageSection);
      mockedGenerateWebCacheReport.mockResolvedValue(mockWebCacheSection);

      const expectedPartialReport: CleanerReport = {
        appCache: emptySection,
        logFiles: mockLogFilesSection,
        trash: mockTrashSection,
        webStorage: mockWebStorageSection,
        webCache: mockWebCacheSection,
      };

      // First call
      const firstResult = await generateCleanerReport();
      expect(firstResult).toEqual(expectedPartialReport);

      // Reset mock call counts but keep the same mock implementations
      mockedGenerateAppCacheReport.mockClear();
      mockedGenerateLogsFilesReport.mockClear();
      mockedGenerateTrashFilesReport.mockClear();
      mockedGenerateWebStorageFilesReport.mockClear();
      mockedGenerateWebCacheReport.mockClear();
      mockedLogger.error.mockClear();

      // Second call should return cached partial report
      const secondResult = await generateCleanerReport();
      expect(secondResult).toEqual(expectedPartialReport);
      expect(secondResult).toBe(firstResult); // Same object reference

      // Verify no generators were called again
      expect(mockedGenerateAppCacheReport).not.toHaveBeenCalled();
      expect(mockedLogger.error).not.toHaveBeenCalled(); // No new errors logged
    });

    it('should not cache when catastrophic error occurs', async () => {
      // Mock Promise.allSettled to throw
      vi.spyOn(Promise, 'allSettled').mockRejectedValueOnce(new Error('Catastrophic failure'));

      // First call should fail and not cache
      const firstResult = await generateCleanerReport();
      expect(firstResult).toEqual(expectedEmptyReport);

      // Restore Promise.allSettled
      vi.spyOn(Promise, 'allSettled').mockRestore();

      // Clear cache and reset all mocks completely
      clearCleanerReportCache();
      mockedGenerateAppCacheReport.mockReset();
      mockedGenerateLogsFilesReport.mockReset();
      mockedGenerateTrashFilesReport.mockReset();
      mockedGenerateWebStorageFilesReport.mockReset();
      mockedGenerateWebCacheReport.mockReset();
      mockedLogger.error.mockClear();

      // Set up fresh successful mocks for second call
      mockedGenerateAppCacheReport.mockResolvedValue(mockAppCacheSection);
      mockedGenerateLogsFilesReport.mockResolvedValue(mockLogFilesSection);
      mockedGenerateTrashFilesReport.mockResolvedValue(mockTrashSection);
      mockedGenerateWebStorageFilesReport.mockResolvedValue(mockWebStorageSection);
      mockedGenerateWebCacheReport.mockResolvedValue(mockWebCacheSection);

      // Second call should work normally (not return cached empty result)
      const secondResult = await generateCleanerReport();
      expect(secondResult).toEqual(expectedCompleteReport);
      expect(mockedGenerateAppCacheReport).toHaveBeenCalledTimes(1); // Called exactly once for the second call
    });
  });

  describe('edge cases', () => {
    it('should handle sections returning empty results', async () => {
      mockedGenerateAppCacheReport.mockResolvedValue(emptySection);
      mockedGenerateLogsFilesReport.mockResolvedValue(emptySection);
      mockedGenerateTrashFilesReport.mockResolvedValue(emptySection);
      mockedGenerateWebStorageFilesReport.mockResolvedValue(emptySection);
      mockedGenerateWebCacheReport.mockResolvedValue(emptySection);

      const result = await generateCleanerReport();

      expect(result).toEqual(expectedEmptyReport);
      expect(mockedLogger.error).not.toHaveBeenCalled(); // No errors should be logged
    });

    it('should handle mixed success, failure, and empty results', async () => {
      mockedGenerateAppCacheReport.mockResolvedValue(mockAppCacheSection); // Success
      mockedGenerateLogsFilesReport.mockRejectedValue(new Error('Failed')); // Failure
      mockedGenerateTrashFilesReport.mockResolvedValue(emptySection); // Empty success
      mockedGenerateWebStorageFilesReport.mockRejectedValue(new Error('Failed')); // Failure
      mockedGenerateWebCacheReport.mockResolvedValue(mockWebCacheSection); // Success

      const result = await generateCleanerReport();

      expect(result).toEqual({
        appCache: mockAppCacheSection,
        logFiles: emptySection, // Failed -> empty fallback
        trash: emptySection, // Legitimately empty
        webStorage: emptySection, // Failed -> empty fallback
        webCache: mockWebCacheSection,
      });

      expect(mockedLogger.error).toHaveBeenCalledTimes(2); // Two failures logged
    });
  });
});
