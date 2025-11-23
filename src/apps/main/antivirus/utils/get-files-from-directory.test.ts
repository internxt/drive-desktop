import { deepMocked } from 'tests/vitest/utils.helper.test';
import { getFilesFromDirectory } from './get-files-from-directory';
import { PathTypeChecker } from '@/apps/shared/fs/PathTypeChecker';
import { readdir } from 'node:fs/promises';
import { win32 } from 'node:path';

vi.mock(import('node:fs/promises'));
vi.mock(import('@/apps/shared/fs/PathTypeChecker'));

describe('get-files-from-directory', () => {
  const PathTypeCheckerMock = vi.mocked(PathTypeChecker);
  const readdirMock = deepMocked(readdir);

  const rootFolder = win32.join('C:', 'Users', 'user', 'internxt');

  it('If root is a file then do nothing', async () => {
    // Given
    PathTypeCheckerMock.isFolder.mockResolvedValue(false);

    // When
    const files = await getFilesFromDirectory({ rootFolder });

    // Then
    expect(files).toStrictEqual([]);
  });

  it('Should return all files', async () => {
    // Given
    PathTypeCheckerMock.isFolder.mockResolvedValue(true);
    readdirMock
      .mockResolvedValueOnce([
        { name: 'file1', isFile: () => true, isDirectory: () => false },
        { name: 'file2', isFile: () => true, isDirectory: () => false },
        { name: 'folder1', isFile: () => false, isDirectory: () => true },
        { name: 'folder2', isFile: () => false, isDirectory: () => true },
      ] as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ name: 'file3', isFile: () => true, isDirectory: () => false } as any]);

    // When
    const files = await getFilesFromDirectory({ rootFolder });

    // Then
    expect(files).toStrictEqual([
      win32.join(rootFolder, 'file1'),
      win32.join(rootFolder, 'file2'),
      win32.join(rootFolder, 'folder1', 'file3'),
    ]);
  });
});
