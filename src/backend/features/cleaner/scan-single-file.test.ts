import { promises as fs, Stats } from 'node:fs';
import { scanSingleFile } from './scan-single-file';
import { wasAccessedWithinLastHour } from './utils/was-accessed-within-last-hour';
import { createCleanableItem } from './utils/create-cleanable-item';
import { logger } from '@internxt/drive-desktop-core/build/backend';

vi.mock('fs', () => ({
  promises: {
    stat: vi.fn(),
  },
}));
vi.mock('./utils/was-accessed-within-last-hour');
vi.mock('./utils/create-cleanable-item');
vi.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('scanSingleFile', () => {
  const mockedFs = vi.mocked(fs);
  const mockedWasAccessedWithinLastHour = vi.mocked(wasAccessedWithinLastHour);
  const mockedCreateCleanableItem = vi.mocked(createCleanableItem);
  const mockedLogger = vi.mocked(logger);

  const mockFilePath = '/home/user/.xsession-errors';
  const mockCleanableItem = {
    fullPath: mockFilePath,
    fileName: '.xsession-errors',
    sizeInBytes: 2048,
  };

  const createMockStats = (isFile = true, size = 0): Stats =>
    ({ isDirectory: () => !isFile, isFile: () => isFile, size }) as Stats;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedFs.stat.mockResolvedValue(createMockStats());
    mockedWasAccessedWithinLastHour.mockResolvedValue(false);
  });

  it('should return CleanableItem array when file is safe to delete', async () => {
    mockedCreateCleanableItem.mockResolvedValue(mockCleanableItem);

    const result = await scanSingleFile(mockFilePath);

    expect(result).toStrictEqual([mockCleanableItem]);
    expect(mockedFs.stat).toHaveBeenCalledWith(mockFilePath);
    expect(mockedWasAccessedWithinLastHour).toHaveBeenCalledWith(mockFilePath);
    expect(mockedCreateCleanableItem).toHaveBeenCalledWith(mockFilePath);
  });

  it('should return empty array when path is not a file', async () => {
    mockedFs.stat.mockResolvedValue(createMockStats(false));

    const result = await scanSingleFile(mockFilePath);

    expect(result).toStrictEqual([]);
    expect(mockedWasAccessedWithinLastHour).not.toHaveBeenCalled();
    expect(mockedCreateCleanableItem).not.toHaveBeenCalled();
  });

  it('should return empty array when file was accessed within last hour', async () => {
    mockedWasAccessedWithinLastHour.mockResolvedValue(true);

    const result = await scanSingleFile(mockFilePath);

    expect(result).toStrictEqual([]);
    expect(mockedCreateCleanableItem).not.toHaveBeenCalled();
  });

  it('should handle file access errors gracefully and log warning', async () => {
    mockedFs.stat.mockRejectedValue(new Error('File not found'));

    const result = await scanSingleFile(mockFilePath);

    expect(result).toStrictEqual([]);
    expect(mockedLogger.warn).toHaveBeenCalledWith({
      msg: `Single file with file path ${mockFilePath} cannot be accessed, skipping`,
    });
  });
});
