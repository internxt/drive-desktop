import { Stats } from 'node:fs';
import { stat } from 'node:fs/promises';

import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { mockProps, partialSpyOn, deepMocked, calls } from '@/tests/vitest/utils.helper.test';

import * as createCleanableItemMocule from '../utils/create-cleanable-item';
import * as wasAccessedWithinLastHourModule from '../utils/was-accessed-within-last-hour';
import { processDirent } from './process-dirent';
import * as scanDirectoryModule from './scan-directory';

vi.mock(import('node:fs/promises'));

describe('processDirent', () => {
  const statMock = deepMocked(stat);
  const wasAccessedWithinLastHourMock = partialSpyOn(wasAccessedWithinLastHourModule, 'wasAccessedWithinLastHour');
  const createCleanableItemMock = partialSpyOn(createCleanableItemMocule, 'createCleanableItem');
  const scanDirectoryMock = partialSpyOn(scanDirectoryModule, 'scanDirectory');

  const fullPath = '/test/test.txt';
  const name = 'test.txt';
  const mockCleanableItem = {
    fullPath,
    fileName: name,
    sizeInBytes: 1024,
  };

  let props: Parameters<typeof processDirent>[0];

  const createMockStats = (isFile = true) => ({ isDirectory: () => !isFile, isFile: () => isFile }) as unknown as Stats;

  beforeEach(() => {
    statMock.mockResolvedValue(createMockStats());
    wasAccessedWithinLastHourMock.mockReturnValue(false);
    props = mockProps<typeof processDirent>({ entry: { name }, fullPath });
  });

  describe('for files', () => {
    beforeEach(() => {
      props.entry.isFile = vi.fn().mockReturnValue(true);
    });

    it('should process file and return CleanableItem when file is safe to delete', async () => {
      // Given
      props.customFileFilter = vi.fn().mockReturnValue(true);
      createCleanableItemMock.mockReturnValue(mockCleanableItem);
      // When
      const result = await processDirent(props);
      // Then
      expect(result).toStrictEqual([mockCleanableItem]);
      expect(wasAccessedWithinLastHourMock).toBeCalledWith({ fileStats: expect.any(Object) });
      expect(createCleanableItemMock).toBeCalledWith({ filePath: fullPath, stat: expect.any(Object) });
    });

    it('should return empty array when file was accessed within last hour', async () => {
      // Given
      wasAccessedWithinLastHourMock.mockReturnValue(true);
      // When
      const result = await processDirent(props);
      // Then
      expect(result).toStrictEqual([]);
      expect(createCleanableItemMock).not.toHaveBeenCalled();
    });

    it('should return empty array when custom filter excludes file', async () => {
      // Given
      props.customFileFilter = vi.fn().mockReturnValue(false);
      wasAccessedWithinLastHourMock.mockReturnValue(false);
      // When
      const result = await processDirent(props);
      // Then
      expect(result).toStrictEqual([]);
      expect(props.customFileFilter).toBeCalledWith({ fileName: name });
      expect(createCleanableItemMock).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully and log warning', async () => {
      // Given
      statMock.mockRejectedValue(new Error('Permission denied'));
      // When
      const result = await processDirent(props);
      // Then
      expect(result).toStrictEqual([]);
      calls(loggerMock.warn).toHaveLength(1);
    });
  });

  describe('for folders', () => {
    beforeEach(() => {
      props.entry.isFile = vi.fn().mockReturnValue(false);
      props.entry.isDirectory = vi.fn().mockReturnValue(true);
    });

    it('should process directory by calling scanDirectory', async () => {
      // Given
      scanDirectoryMock.mockResolvedValue([mockCleanableItem]);
      // When
      const result = await processDirent(props);
      // Then
      expect(result).toStrictEqual([mockCleanableItem]);
      expect(scanDirectoryMock).toBeCalledTimes(1);
      expect(wasAccessedWithinLastHourMock).not.toHaveBeenCalled();
    });

    it('should return empty array when custom filter excludes folder', async () => {
      // Given
      props.customDirectoryFilter = vi.fn().mockReturnValue(true);
      // When
      const result = await processDirent(props);
      // Then
      expect(result).toStrictEqual([]);
      expect(props.customDirectoryFilter).toBeCalledWith({ folderName: name });
      expect(createCleanableItemMock).not.toHaveBeenCalled();
    });
  });
});
