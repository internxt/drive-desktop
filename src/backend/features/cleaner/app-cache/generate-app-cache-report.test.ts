import { generateAppCacheReport } from './generate-app-cache-report';
import { scanDirectory } from '../scan-directory';
import { getAppCachePaths } from './get-app-cache-paths';
import { scanSubDirectory } from '../scan-subdirectory';
import { appCacheFileFilter } from './utils/is-safe-cache-file';
import { isDirectoryWebBrowserRelated } from '../utils/is-directory-web-browser-related';

jest.mock('../scan-directory');
jest.mock('./get-app-cache-paths');
jest.mock('../scan-subdirectory');
jest.mock('./utils/is-safe-cache-file');
jest.mock('../utils/is-directory-web-browser-related');
jest.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    warn: jest.fn(),
  },
}));

describe('generateAppCacheReport', () => {
  const mockedScanDirectory = jest.mocked(scanDirectory);
  const mockedGetAppCachePaths = jest.mocked(getAppCachePaths);
  const mockedScanSubDirectory = jest.mocked(scanSubDirectory);
  const mockedAppCacheFileFilter = jest.mocked(appCacheFileFilter);
  const mockedIsDirectoryWebBrowserRelated = jest.mocked(
    isDirectoryWebBrowserRelated
  );

  const mockPaths = {
    userCache: '/home/user/.cache',
    tmpDir: '/tmp',
    varTmpDir: '/var/tmp',
    localShareCache: '/home/user/.local/share',
  };

  const createMockItem = (
    fileName: string,
    size: number,
    basePath: string
  ) => ({
    fullPath: `${basePath}/${fileName}`,
    fileName,
    sizeInBytes: size,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedScanDirectory.mockResolvedValue([]);
    mockedScanSubDirectory.mockResolvedValue([]);
    mockedGetAppCachePaths.mockReturnValue(mockPaths);
  });

  it('should generate app cache report with all scan results and the total size in bytes', async () => {
    const userCacheItems = [
      createMockItem('cache1.tmp', 1, mockPaths.userCache),
    ];
    const tmpDirItems = [createMockItem('temp1.log', 1, mockPaths.tmpDir)];
    const varTmpItems = [
      createMockItem('var-temp1.cache', 1, mockPaths.varTmpDir),
    ];
    const localShareItems = [
      createMockItem('app-cache.dat', 1, mockPaths.localShareCache),
    ];

    mockedScanDirectory
      .mockResolvedValueOnce(userCacheItems)
      .mockResolvedValueOnce(tmpDirItems)
      .mockResolvedValueOnce(varTmpItems);

    mockedScanSubDirectory.mockResolvedValue(localShareItems);

    const result = await generateAppCacheReport();

    expect(result.totalSizeInBytes).toBe(4);
    expect(result.items).toEqual([
      ...userCacheItems,
      ...tmpDirItems,
      ...varTmpItems,
      ...localShareItems,
    ]);
  });

  it('should call scanDirectory with correct parameters', async () => {
    await generateAppCacheReport();

    expect(mockedScanDirectory).toHaveBeenCalledTimes(3);
    expect(mockedScanDirectory).toHaveBeenCalledWith(
      expect.objectContaining({
        dirPath: mockPaths.userCache,
        customFileFilter: mockedAppCacheFileFilter,
      })
    );
    expect(mockedScanDirectory).toHaveBeenCalledWith(
      expect.objectContaining({
        dirPath: mockPaths.tmpDir,
        customFileFilter: mockedAppCacheFileFilter,
      })
    );
    expect(mockedScanDirectory).toHaveBeenCalledWith(
      expect.objectContaining({
        dirPath: mockPaths.varTmpDir,
        customFileFilter: mockedAppCacheFileFilter,
      })
    );
  });

  it('should call scanSubDirectory with correct parameters', async () => {
    await generateAppCacheReport();

    expect(mockedScanSubDirectory).toHaveBeenCalledTimes(1);
    expect(mockedScanSubDirectory).toHaveBeenCalledWith(
      expect.objectContaining({
        baseDir: mockPaths.localShareCache,
        subPath: 'cache',
        customDirectoryFilter: mockedIsDirectoryWebBrowserRelated,
        customFileFilter: mockedAppCacheFileFilter,
      })
    );
  });

  it('should handle scan errors gracefully with Promise.allSettled', async () => {
    const successItems = [createMockItem('success.tmp', 1024, '/tmp')];

    mockedScanDirectory
      .mockRejectedValueOnce(new Error('Permission denied'))
      .mockResolvedValueOnce(successItems)
      .mockRejectedValueOnce(new Error('Directory not found'));

    mockedScanSubDirectory.mockResolvedValue([]);

    const result = await generateAppCacheReport();

    expect(result.totalSizeInBytes).toBe(1024);
    expect(result.items).toEqual(successItems);
  });

  it('should return empty report when all scans fail', async () => {
    mockedScanDirectory.mockRejectedValue(new Error('Failed'));
    mockedScanSubDirectory.mockRejectedValue(new Error('Failed'));

    const result = await generateAppCacheReport();

    expect(result.totalSizeInBytes).toBe(0);
    expect(result.items).toEqual([]);
  });
});
