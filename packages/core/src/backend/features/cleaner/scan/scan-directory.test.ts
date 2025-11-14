import { Dirent } from 'node:fs';
import { readdir } from 'node:fs/promises';

import { deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';

import { CleanableItem } from '../types/cleaner.types';
import * as isInternxtRelatedModule from '../utils/is-file-internxt-related';
import * as processDirentModule from './process-dirent';
import { scanDirectory } from './scan-directory';

vi.mock(import('node:fs/promises'));

describe('scanDirectory', () => {
  const readdirMock = deepMocked(readdir);
  const mockBasePath = '/test/path';
  const isInternxtRelatedMock = partialSpyOn(isInternxtRelatedModule, 'isInternxtRelated');
  const processDirentMock = partialSpyOn(processDirentModule, 'processDirent');

  const createMockDirent = (name: string, isFile = true) =>
    ({
      name,
      isFile: () => isFile,
      isDirectory: () => !isFile,
    }) as unknown as Dirent<Buffer>;

  const createCleanableItemMock = (fileName: string, size: number, basePath = mockBasePath) =>
    ({
      fullPath: `${basePath}/${fileName}`,
      fileName,
      sizeInBytes: size,
    }) as CleanableItem;

  let props: Parameters<typeof scanDirectory>[0];

  beforeEach(() => {
    isInternxtRelatedMock.mockReturnValue(false);
    props = mockProps<typeof scanDirectory>({ dirPath: mockBasePath });
  });

  it('should scan files in directory correctly', async () => {
    readdirMock.mockResolvedValue([createMockDirent('file1.txt', true)]);

    const expectedItem = createCleanableItemMock('file1.txt', 2048);
    processDirentMock.mockResolvedValue([expectedItem]);
    const result = await scanDirectory(props);

    expect(readdirMock).toHaveBeenCalled();
    expect(processDirentMock).toHaveBeenCalled();
    expect(result).toStrictEqual([expectedItem]);
    expect(processDirentMock).toBeCalledWith(
      expect.objectContaining({
        entry: expect.objectContaining({ name: 'file1.txt' }),
        fullPath: '/test/path/file1.txt',
        customFileFilter: undefined,
      }),
    );
  });

  it('should skip Internxt-related files and directories', async () => {
    readdirMock.mockResolvedValue([createMockDirent('internxt-app', false), createMockDirent('regular-file.txt', true)]);

    isInternxtRelatedMock.mockReturnValueOnce(true).mockReturnValueOnce(false);

    const expectedItem = createCleanableItemMock('regular-file.txt', 1024);
    processDirentMock.mockResolvedValue([expectedItem]);
    const result = await scanDirectory(props);

    expect(result).toStrictEqual([expectedItem]);
    expect(isInternxtRelatedMock).toBeCalledWith({ name: '/test/path/internxt-app' });
    expect(isInternxtRelatedMock).toBeCalledWith({ name: '/test/path/regular-file.txt' });
    expect(processDirentMock).toBeCalledTimes(1);
    expect(processDirentMock).toBeCalledWith(
      expect.objectContaining({
        entry: expect.objectContaining({ name: 'regular-file.txt' }),
        fullPath: '/test/path/regular-file.txt',
        customFileFilter: undefined,
      }),
    );
  });

  it('should recursively scan subdirectories', async () => {
    const dirent = createMockDirent('subdir', false);
    readdirMock.mockResolvedValue([dirent]);

    const expectedItem = [createCleanableItemMock('nested-file.txt', 512, '/test/path/subdir')];
    processDirentMock.mockResolvedValue(expectedItem);

    const result = await scanDirectory(props);

    expect(result).toStrictEqual(expectedItem);
    expect(readdirMock).toBeCalledWith(mockBasePath, {
      withFileTypes: true,
    });

    expect(processDirentMock).toBeCalledWith(
      expect.objectContaining({
        entry: dirent,
        fullPath: '/test/path/subdir',
        customFileFilter: undefined,
      }),
    );
  });

  it('should handle mixed files and directories', async () => {
    readdirMock.mockResolvedValue([
      createMockDirent('file1.txt', true),
      createMockDirent('subdir', false),
      createMockDirent('file2.log', true),
    ]);

    const file1Item = createCleanableItemMock('file1.txt', 100);
    const file2Item = createCleanableItemMock('file2.log', 300);
    const subdirItem = createCleanableItemMock('nested.txt', 200, '/test/path/subdir');
    processDirentMock.mockResolvedValueOnce([file1Item]).mockResolvedValueOnce([subdirItem]).mockResolvedValueOnce([file2Item]);

    const result = await scanDirectory(props);

    expect(result).toStrictEqual([file1Item, subdirItem, file2Item]);
    expect(processDirentMock).toBeCalledTimes(3);
  });

  it('should skip files that cannot be accessed due to permissions', async () => {
    readdirMock.mockResolvedValue([createMockDirent('accessible-file.txt', true), createMockDirent('restricted-file.txt', true)]);

    const accessibleItem = [createCleanableItemMock('accessible-file.txt', 1024)];
    processDirentMock.mockResolvedValueOnce(accessibleItem).mockResolvedValueOnce([]);
    const result = await scanDirectory(props);

    expect(result).toStrictEqual(accessibleItem);
    expect(processDirentMock).toBeCalledTimes(2);
  });

  it('should handle empty directories', async () => {
    // Given
    readdirMock.mockResolvedValue([]);
    // When
    const result = await scanDirectory(props);
    // Then
    expect(result).toStrictEqual([]);
    expect(processDirentMock).toBeCalledTimes(0);
  });

  it('should handle readdir errors gracefully', async () => {
    // Given
    readdirMock.mockRejectedValue(new Error('Cannot read directory'));
    // When
    const result = await scanDirectory(props);
    // Then
    expect(result).toStrictEqual([]);
  });
});
