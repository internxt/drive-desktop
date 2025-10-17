import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { generateWindowsSpecificFileReport } from './generate-windows-specific-file-report';
import { pathsToClean } from './paths-to-clean';
import * as generateReportModule from './generate-report';
import { calls, call, partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('generateWindowsSpecificFileReport', () => {
  const scanDirectoryMock = partialSpyOn(CleanerModule, 'scanDirectory');
  const generateReportMock = partialSpyOn(generateReportModule, 'generateReport');

  const mockCleanableItems = [
    {
      fullPath: 'G:\\Windows\\SoftwareDistribution\\Download\\file1.tmp',
      fileName: 'file1.tmp',
      sizeInBytes: 1024,
    },
    {
      fullPath: 'G:\\Windows\\Prefetch\\file2.pf',
      fileName: 'file2.pf',
      sizeInBytes: 2048,
    },
  ];

  const mockReport = {
    totalSizeInBytes: 3072,
    items: mockCleanableItems,
  };

  beforeEach(() => {
    generateReportMock.mockResolvedValue(mockReport);
  });

  it('should scan Windows Update cache and Prefetch directories and generate a report', async () => {
    // Given
    const windowsUpdateCacheItems = [mockCleanableItems[0]];
    const prefetchItems = [mockCleanableItems[1]];

    scanDirectoryMock.mockResolvedValueOnce(windowsUpdateCacheItems).mockResolvedValueOnce(prefetchItems);
    // When
    const result = await generateWindowsSpecificFileReport();
    // Then
    calls(scanDirectoryMock).toHaveLength(2);
    calls(scanDirectoryMock).toMatchObject([
      {
        dirPath: pathsToClean.windowsSpecific.windowsUpdateCache,
      },
      {
        dirPath: pathsToClean.windowsSpecific.prefetch,
      },
    ]);
    calls(generateReportMock).toHaveLength(1);
    call(generateReportMock).toMatchObject({
      promises: [expect.any(Promise), expect.any(Promise)],
    });

    expect(result).toStrictEqual(mockReport);
  });
});
