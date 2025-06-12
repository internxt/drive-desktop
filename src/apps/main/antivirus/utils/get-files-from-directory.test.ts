import { deepMocked } from 'tests/vitest/utils.helper.test';
import { getFilesFromDirectory } from './get-files-from-directory';
import { PathTypeChecker } from '@/apps/shared/fs/PathTypeChecker';
import { readdir } from 'fs/promises';
import { win32 } from 'path';

vi.mock(import('fs/promises'));
vi.mock(import('@/apps/shared/fs/PathTypeChecker'));

describe('get-files-from-directory', () => {
  const PathTypeCheckerMock = vi.mocked(PathTypeChecker);
  const readdirMock = deepMocked(readdir);

  const rootFolder = win32.join('C:', 'Users', 'user', 'internxt');

  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    readdirMock.mockResolvedValueOnce([
      { name: 'file1' as unknown as Buffer, isFile: () => true, isDirectory: () => false },
      { name: 'file2' as unknown as Buffer, isFile: () => true, isDirectory: () => false },
      { name: 'tmpfile1' as unknown as Buffer, isFile: () => true, isDirectory: () => false },
      { name: 'tempfile1' as unknown as Buffer, isFile: () => true, isDirectory: () => false },
      { name: 'folder1' as unknown as Buffer, isFile: () => false, isDirectory: () => true },
      { name: 'folder2' as unknown as Buffer, isFile: () => false, isDirectory: () => true },
    ]);
    readdirMock.mockResolvedValueOnce([{ name: 'file3' as unknown as Buffer, isFile: () => true, isDirectory: () => false }]);

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
