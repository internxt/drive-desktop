import { Dirent } from 'node:fs';
import { processDirent } from './process-dirent';
import { wasAccessedWithinLastHour } from './utils/was-accessed-within-last-hour';
import { createCleanableItem } from './utils/create-cleanable-item';
import { scanDirectory } from './scan-directory';
import { logger } from '@internxt/drive-desktop-core/build/backend';

vi.mock('./utils/was-accessed-within-last-hour');
vi.mock('./utils/create-cleanable-item');
vi.mock('./scan-directory');
vi.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('processDirent', () => {
  const mockedWasAccessedWithinLastHour = vi.mocked(wasAccessedWithinLastHour);
  const mockedCreateCleanableItem = vi.mocked(createCleanableItem);
  const mockedScanDirectory = vi.mocked(scanDirectory);
  const mockedLogger = vi.mocked(logger);
  const mockBasePath = '/test';
  const mockFileName = 'test.txt';
  const mockFullpath = `${mockBasePath}/${mockFileName}`;
  const createMockDirent = (name: string, isFile = true): Dirent =>
    ({
      name,
      isFile: () => isFile,
      isDirectory: () => !isFile,
    }) as Dirent;

  const mockFileDirent = createMockDirent(mockFileName);
  const mockCleanableItem = {
    fullPath: mockFullpath,
    fileName: mockFileName,
    sizeInBytes: 1024,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedWasAccessedWithinLastHour.mockResolvedValue(false);
  });

  it('should process file and return CleanableItem when file is safe to delete', async () => {
    mockedCreateCleanableItem.mockResolvedValue(mockCleanableItem);
    const result = await processDirent({
      entry: mockFileDirent,
      fullPath: mockFullpath,
    });

    expect(result).toStrictEqual([mockCleanableItem]);
    expect(mockedWasAccessedWithinLastHour).toHaveBeenCalledWith(mockFullpath);
    expect(mockedCreateCleanableItem).toHaveBeenCalledWith(mockFullpath);
  });

  it('should return empty array when file was accessed within last hour', async () => {
    mockedWasAccessedWithinLastHour.mockResolvedValue(true);

    const result = await processDirent({
      entry: mockFileDirent,
      fullPath: mockFullpath,
    });

    expect(result).toStrictEqual([]);
    expect(mockedCreateCleanableItem).not.toHaveBeenCalled();
  });

  it('should return empty array when custom filter excludes file', async () => {
    const customFileFilter = vi.fn().mockReturnValue(true); // true means skip
    mockedWasAccessedWithinLastHour.mockResolvedValue(false);
    const result = await processDirent({
      entry: mockFileDirent,
      fullPath: mockFullpath,
      customFileFilter,
    });

    expect(result).toStrictEqual([]);
    expect(customFileFilter).toHaveBeenCalledWith(mockFileDirent.name);
    expect(mockedCreateCleanableItem).not.toHaveBeenCalled();
  });

  it('should process directory by calling scanDirectory', async () => {
    const mockDir = createMockDirent('subdir', false);
    const mockPath = '/test/subdir';
    const mockDirectoryItems = [mockCleanableItem];

    mockedScanDirectory.mockResolvedValue(mockDirectoryItems);

    const result = await processDirent({
      entry: mockDir,
      fullPath: mockPath,
    });

    expect(result).toStrictEqual(mockDirectoryItems);
    expect(mockedScanDirectory).toHaveBeenCalledTimes(1);
    expect(mockedWasAccessedWithinLastHour).not.toHaveBeenCalled();
  });

  it('should process directory when custom directory filter allows it', async () => {
    const mockDir = createMockDirent('important-folder', false);
    const mockPath = '/test/important-folder';
    const customDirectoryFilter = vi.fn().mockReturnValue(false); // false means process
    const customFileFilter = vi.fn();
    const mockDirectoryItems = [mockCleanableItem];

    mockedScanDirectory.mockResolvedValue(mockDirectoryItems);

    const result = await processDirent({
      entry: mockDir,
      fullPath: mockPath,
      customDirectoryFilter,
      customFileFilter,
    });

    expect(result).toStrictEqual(mockDirectoryItems);
    expect(customDirectoryFilter).toHaveBeenCalledWith(mockDir.name);
    expect(mockedScanDirectory).toHaveBeenCalledWith(
      expect.objectContaining({
        dirPath: mockPath,
        customFileFilter,
        customDirectoryFilter,
      }),
    );
  });

  it('should handle errors gracefully and log warning', async () => {
    mockedWasAccessedWithinLastHour.mockRejectedValue(new Error('Permission denied'));

    const result = await processDirent({
      entry: mockFileDirent,
      fullPath: mockFullpath,
    });

    expect(result).toStrictEqual([]);
    expect(mockedLogger.warn).toHaveBeenCalledWith({
      msg: `File or Directory with path ${mockFullpath} cannot be accessed, skipping`,
    });
  });
});
