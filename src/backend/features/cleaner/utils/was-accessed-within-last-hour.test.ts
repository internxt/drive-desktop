import { promises as fs, Stats } from 'fs';
import {
  wasAccessedWithinLastHour,
} from './was-accessed-within-last-hour';

jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(),
  },
}));

describe('wasAccessedWithinLastHour', () => {
  const mockedFs = jest.mocked(fs);
  const mockFilePath = '/test/file.txt';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return true when file was accessed within last hour', async () => {
    const recentTime = new Date('2024-01-01T11:30:00Z'); // 30 minutes ago
    const mockStat = {
      atime: recentTime,
      mtime: new Date('2024-01-01T10:00:00Z'),
    } as Stats;
    mockedFs.stat.mockResolvedValue(mockStat);

    const result = await wasAccessedWithinLastHour(mockFilePath);

    expect(result).toBe(true);
  });

  it('should return false when file was accessed more than an hour ago', async () => {
    const oldTime = new Date('2024-01-01T10:30:00Z'); // 1.5 hours ago
    const mockStat = {
      atime: oldTime,
      mtime: oldTime,
    } as Stats;
    mockedFs.stat.mockResolvedValue(mockStat);

    const result = await wasAccessedWithinLastHour(mockFilePath);

    expect(result).toBe(false);
  });

  it('should return true when file access check fails (safety first)', async () => {
    mockedFs.stat.mockRejectedValue(new Error('Permission denied'));

    const result = await wasAccessedWithinLastHour(mockFilePath);

    expect(result).toBe(true);
  });
});
