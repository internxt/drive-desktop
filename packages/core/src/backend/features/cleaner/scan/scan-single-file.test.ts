import { promises as fs, Stats } from 'node:fs';

import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { partialSpyOn, deepMocked, calls } from '@/tests/vitest/utils.helper.test';

import * as createCleanableItemModule from '../utils/create-cleanable-item';
import * as wasAccessedWithinLastHourModule from '../utils/was-accessed-within-last-hour';
import { scanSingleFile } from './scan-single-file';

vi.mock(import('node:fs'));

describe('scanSingleFile', () => {
  const statMock = deepMocked(fs.stat);
  const wasAccessedWithinLastHourMock = partialSpyOn(wasAccessedWithinLastHourModule, 'wasAccessedWithinLastHour');
  const createCleanableItemMock = partialSpyOn(createCleanableItemModule, 'createCleanableItem');

  const mockFilePath = '/home/user/.xsession-errors';
  const mockCleanableItem = {
    fullPath: mockFilePath,
    fileName: '.xsession-errors',
    sizeInBytes: 2048,
  };

  const createMockStats = (isFile = true) => ({ isDirectory: () => !isFile, isFile: () => isFile }) as unknown as Stats;

  beforeEach(() => {
    statMock.mockResolvedValue(createMockStats());
    wasAccessedWithinLastHourMock.mockReturnValue(false);
  });

  it('should return CleanableItem array when file is safe to delete', async () => {
    // Given
    createCleanableItemMock.mockReturnValue(mockCleanableItem);
    // When
    const result = await scanSingleFile({ filePath: mockFilePath });
    // Then
    expect(result).toStrictEqual([mockCleanableItem]);
    expect(statMock).toBeCalledWith(mockFilePath);
    expect(wasAccessedWithinLastHourMock).toBeCalledWith({ fileStats: expect.any(Object) });
    expect(createCleanableItemMock).toBeCalledWith({ filePath: mockFilePath, stat: expect.any(Object) });
  });

  it('should return empty array when path is not a file', async () => {
    // Given
    statMock.mockResolvedValue(createMockStats(false));
    // When
    const result = await scanSingleFile({ filePath: mockFilePath });
    // Then
    expect(result).toStrictEqual([]);
    expect(wasAccessedWithinLastHourMock).not.toHaveBeenCalled();
    expect(createCleanableItemMock).not.toHaveBeenCalled();
  });

  it('should return empty array when file was accessed within last hour', async () => {
    // Given
    wasAccessedWithinLastHourMock.mockReturnValue(true);
    // When
    const result = await scanSingleFile({ filePath: mockFilePath });
    // Then
    expect(result).toStrictEqual([]);
    expect(createCleanableItemMock).not.toHaveBeenCalled();
  });

  it('should handle file access errors gracefully and log warning', async () => {
    // Given
    statMock.mockRejectedValue(new Error('File not found'));
    // When
    const result = await scanSingleFile({ filePath: mockFilePath });
    // Then
    expect(result).toStrictEqual([]);
    calls(loggerMock.warn).toHaveLength(1);
  });
});
