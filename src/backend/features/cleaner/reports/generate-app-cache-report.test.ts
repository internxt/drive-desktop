import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { generateAppCacheReport } from './generate-app-cache-report';
import { pathsToClean } from './paths-to-clean';
import * as generateReportModule from './generate-report';
import { calls, call, partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('generateAppCacheReport', () => {
  const scanDirectoryMock = partialSpyOn(CleanerModule, 'scanDirectory');
  const scanSubDirectoryMock = partialSpyOn(CleanerModule, 'scanSubDirectory');
  const generateReportMock = partialSpyOn(generateReportModule, 'generateReport');

  const mockCleanableItems = [
    {
      fullPath: 'G:\\Users\\User\\AppData\\Local\\Temp\\cache1.tmp',
      fileName: 'cache1.tmp',
      sizeInBytes: 2048,
    },
    {
      fullPath: 'G:\\Windows Fake\\Temp\\cache2.tmp',
      fileName: 'cache2.tmp',
      sizeInBytes: 4096,
    },
    {
      fullPath: 'G:\\Users\\User\\AppData\\Local\\cache\\app.cache',
      fileName: 'app.cache',
      sizeInBytes: 1024,
    },
    {
      fullPath: 'G:\\Users\\User\\AppData\\Roaming\\cache\\service.cache',
      fileName: 'service.cache',
      sizeInBytes: 512,
    },
  ];

  const mockReport = {
    totalSizeInBytes: 7680,
    items: mockCleanableItems,
  };

  beforeEach(() => {
    generateReportMock.mockResolvedValue(mockReport);
  });

  it('should scan temp directories and cache subdirectories and generate a report', async () => {
    // Given
    const tempDirItems = [mockCleanableItems[0]];
    const systemTmpDirItems = [mockCleanableItems[1]];
    const localAppDataCacheItems = [mockCleanableItems[2]];
    const roamingAppDataCacheItems = [mockCleanableItems[3]];

    scanDirectoryMock.mockResolvedValueOnce(tempDirItems).mockResolvedValueOnce(systemTmpDirItems);

    scanSubDirectoryMock.mockResolvedValueOnce(localAppDataCacheItems).mockResolvedValueOnce(roamingAppDataCacheItems);
    // When
    const result = await generateAppCacheReport();
    // Then
    calls(scanDirectoryMock).toHaveLength(2);
    calls(scanDirectoryMock).toMatchObject([
      {
        dirPath: pathsToClean.cache.tempDir,
      },
      {
        dirPath: pathsToClean.cache.systemTmpDir,
      },
    ]);

    calls(scanSubDirectoryMock).toHaveLength(2);
    calls(scanSubDirectoryMock).toMatchObject([
      {
        baseDir: pathsToClean.localAppData,
      },
      {
        baseDir: pathsToClean.roamingAppData,
      },
    ]);

    calls(generateReportMock).toHaveLength(1);
    call(generateReportMock).toMatchObject({
      promises: expect.arrayContaining([expect.any(Promise), expect.any(Promise), expect.any(Promise), expect.any(Promise)]),
    });

    expect(result).toEqual(mockReport);
  });
});
