import { Dirent } from 'node:fs';

import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';

import { CleanableItem } from '../types/cleaner.types';
import * as getFilteredDirectoriesModule from '../utils/get-filtered-directories';
import * as isFileInternextRelatedModule from '../utils/is-file-internxt-related';
import * as scanDirectoryModule from './scan-directory';
import { scanSubDirectory } from './scan-subdirectory';

describe('scanSubDirectory', () => {
  const mockedGetFilteredDirectories = partialSpyOn(getFilteredDirectoriesModule, 'getFilteredDirectories');
  const mockedIsInternxtRelated = partialSpyOn(isFileInternextRelatedModule, 'isInternxtRelated');
  const mockedScanDirectory = partialSpyOn(scanDirectoryModule, 'scanDirectory');

  const createMockDirent = (name: string, isDirectory = true) =>
    ({
      name,
      isDirectory: () => isDirectory,
      isFile: () => !isDirectory,
    }) as unknown as Dirent<string>;

  const mockBaseDir = '/home/user/.cache';
  const mockSubDir = 'cache';

  const createCleanableItemMock = (appName: string, fileName: string, size: number, basePath = mockBaseDir) =>
    ({
      fullPath: `${basePath}/${appName}/${fileName}`,
      fileName,
      sizeInBytes: size,
    }) as CleanableItem;

  let props: Parameters<typeof scanSubDirectory>[0];

  beforeEach(() => {
    mockedIsInternxtRelated.mockReturnValue(false);
    props = mockProps<typeof scanSubDirectory>({
      baseDir: mockBaseDir,
      subPath: mockSubDir,
    });
  });

  it('should scan directories given a certain subPath', async () => {
    // Given
    const mockBaseDir = '/home/user/.local/share';
    props.baseDir = mockBaseDir;
    const mockDirents = [createMockDirent('app1'), createMockDirent('app2')];
    const mockApp1Items = [createCleanableItemMock('app1', 'file1.cache', 1024, mockBaseDir)];
    const mockApp2Items = [createCleanableItemMock('app2', 'file2.cache', 2048, mockBaseDir)];
    mockedGetFilteredDirectories.mockResolvedValue(mockDirents);
    mockedScanDirectory.mockResolvedValueOnce(mockApp1Items).mockResolvedValueOnce(mockApp2Items);
    // When
    const result = await scanSubDirectory(props);
    // Then
    expect(result).toStrictEqual([...mockApp1Items, ...mockApp2Items]);
    expect(mockedGetFilteredDirectories).toBeCalledWith({ baseDir: mockBaseDir, customDirectoryFilter: undefined });
    expect(mockedScanDirectory).toBeCalledWith(expect.objectContaining({ dirPath: `${mockBaseDir}/app1/${mockSubDir}` }));
    expect(mockedScanDirectory).toBeCalledWith(expect.objectContaining({ dirPath: `${mockBaseDir}/app2/${mockSubDir}` }));
  });

  it('should handle scanDirectory errors gracefully', async () => {
    // Given
    const mockDirents = [createMockDirent('app1'), createMockDirent('app2')];
    const app2Items = [createCleanableItemMock('app2', 'cache.tmp', 1024)];
    mockedGetFilteredDirectories.mockResolvedValue(mockDirents);
    mockedScanDirectory.mockRejectedValueOnce(new Error('Permission denied')).mockResolvedValueOnce(app2Items);
    // When
    const result = await scanSubDirectory(props);
    // Then
    expect(result).toStrictEqual(app2Items);
    expect(mockedScanDirectory).toBeCalledTimes(2);
  });
});
