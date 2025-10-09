import { CleanerModule } from '@internxt/drive-desktop-core/build/backend';
import { generateWebStorageFileReport } from './generate-web-storage-files-report';
import { cleanerCtx } from '../cleaner.config';
import { pathsToClean } from './paths-to-clean';
import * as generateReportModule from './generate-report';
import { calls, call, partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('generateWebStorageFileReport', () => {
  const scanDirectoryMock = partialSpyOn(CleanerModule, 'scanDirectory');
  const scanFirefoxProfilesMock = partialSpyOn(CleanerModule, 'scanFirefoxProfiles');
  const generateReportMock = partialSpyOn(generateReportModule, 'generateReport');

  const mockCleanableItems = [
    {
      fullPath: 'G:\\Users\\User\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cookies\\cookie1',
      fileName: 'cookie1',
      sizeInBytes: 512,
    },
    {
      fullPath: 'G:\\Users\\User\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Local Storage\\storage1',
      fileName: 'storage1',
      sizeInBytes: 1024,
    },
    {
      fullPath: 'G:\\Users\\User\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\profile.default\\cookies.sqlite',
      fileName: 'cookies.sqlite',
      sizeInBytes: 2048,
    },
    {
      fullPath: 'G:\\Users\\User\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Cookies\\cookie2',
      fileName: 'cookie2',
      sizeInBytes: 256,
    },
    {
      fullPath: 'G:\\Users\\User\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Local Storage\\storage2',
      fileName: 'storage2',
      sizeInBytes: 768,
    },
  ];

  const mockReport = {
    totalSizeInBytes: 4608,
    items: mockCleanableItems,
  };

  beforeEach(() => {
    generateReportMock.mockResolvedValue(mockReport);
  });

  it('should scan Chrome, Firefox, and Edge web storage directories and generate a report', async () => {
    // Given
    const chromeCookiesItems = [mockCleanableItems[0]];
    const chromeLocalStorageItems = [mockCleanableItems[1]];
    const firefoxItems = [mockCleanableItems[2]];
    const edgeCookiesItems = [mockCleanableItems[3]];
    const edgeLocalStorageItems = [mockCleanableItems[4]];

    scanDirectoryMock
      .mockResolvedValueOnce(chromeCookiesItems)
      .mockResolvedValueOnce(chromeLocalStorageItems)
      .mockResolvedValueOnce(edgeCookiesItems)
      .mockResolvedValueOnce(edgeLocalStorageItems);

    scanFirefoxProfilesMock.mockResolvedValueOnce(firefoxItems);
    // When
    const result = await generateWebStorageFileReport();
    // Then
    calls(scanDirectoryMock).toHaveLength(4);
    calls(scanDirectoryMock).toMatchObject([
      {
        dirPath: pathsToClean.webStorage.chrome.cookies,
      },
      {
        dirPath: pathsToClean.webStorage.chrome.localStorage,
      },
      {
        dirPath: pathsToClean.webStorage.edge.cookies,
      },
      {
        dirPath: pathsToClean.webStorage.edge.localStorage,
      },
    ]);

    calls(scanFirefoxProfilesMock).toHaveLength(1);
    call(scanFirefoxProfilesMock).toMatchObject({
      ctx: cleanerCtx,
      firefoxProfilesDir: pathsToClean.webStorage.firefox,
    });

    calls(generateReportMock).toHaveLength(1);
    call(generateReportMock).toMatchObject({
      promises: expect.arrayContaining([
        expect.any(Promise),
        expect.any(Promise),
        expect.any(Promise),
        expect.any(Promise),
        expect.any(Promise),
      ]),
    });

    expect(result).toEqual(mockReport);
  });
});
