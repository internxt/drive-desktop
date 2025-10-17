import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { generateWebCacheReport } from './generate-web-cache-report';
import { pathsToClean } from './paths-to-clean';
import * as generateReportModule from './generate-report';
import { calls, call, partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('generateWebCacheReport', () => {
  const scanDirectoryMock = partialSpyOn(CleanerModule, 'scanDirectory');
  const scanFirefoxCacheProfilesMock = partialSpyOn(CleanerModule, 'scanFirefoxCacheProfiles');
  const generateReportMock = partialSpyOn(generateReportModule, 'generateReport');

  const mockCleanableItems = [
    {
      fullPath: 'G:\\Users\\User\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache\\cache1',
      fileName: 'cache1',
      sizeInBytes: 2048,
    },
    {
      fullPath: 'G:\\Users\\User\\AppData\\Local\\Mozilla\\Firefox\\Profiles\\profile.default\\cache2',
      fileName: 'cache2',
      sizeInBytes: 4096,
    },
    {
      fullPath: 'G:\\Users\\User\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Cache\\cache3',
      fileName: 'cache3',
      sizeInBytes: 1024,
    },
    {
      fullPath: 'G:\\Users\\User\\AppData\\Local\\Microsoft\\Windows\\INetCache\\cache4',
      fileName: 'cache4',
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

  it('should scan Chrome, Firefox, Edge, and Edge IE cache directories and generate a report', async () => {
    // Given
    const chromeCacheItems = [mockCleanableItems[0]];
    const firefoxCacheItems = [mockCleanableItems[1]];
    const edgeCacheItems = [mockCleanableItems[2]];
    const edgeIECacheItems = [mockCleanableItems[3]];

    scanDirectoryMock.mockResolvedValueOnce(chromeCacheItems).mockResolvedValueOnce(edgeCacheItems).mockResolvedValueOnce(edgeIECacheItems);

    scanFirefoxCacheProfilesMock.mockResolvedValueOnce(firefoxCacheItems);
    // When
    const result = await generateWebCacheReport();
    // Then
    calls(scanDirectoryMock).toHaveLength(3);
    calls(scanDirectoryMock).toMatchObject([
      {
        dirPath: pathsToClean.webCache.chrome,
      },
      {
        dirPath: pathsToClean.webCache.edge,
      },
      {
        dirPath: pathsToClean.webCache.edgeIECache,
      },
    ]);

    calls(scanFirefoxCacheProfilesMock).toHaveLength(1);
    call(scanFirefoxCacheProfilesMock).toMatchObject({
      firefoxCacheDir: pathsToClean.webCache.firefox,
    });

    calls(generateReportMock).toHaveLength(1);
    call(generateReportMock).toMatchObject({
      promises: [expect.any(Promise), expect.any(Promise), expect.any(Promise), expect.any(Promise)],
    });

    expect(result).toStrictEqual(mockReport);
  });
});
