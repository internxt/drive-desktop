import { deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { readdir } from 'node:fs/promises';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { Dirent } from 'node:fs';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { syncWalk } from './sync-walk';

vi.mock(import('node:fs/promises'));

describe('sync-walk', () => {
  const readdirMock = deepMocked(readdir);
  const statMock = partialSpyOn(fileSystem, 'stat');

  const rootFolder = 'C:/Users/user/InternxtDrive' as AbsolutePath;
  const props = mockProps<typeof syncWalk>({ rootFolder });

  it('should return files and folders', async () => {
    // Given
    readdirMock
      .mockResolvedValueOnce(['file1', 'folder1', 'folder2'] as unknown as Dirent<Buffer>[])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(['file2'] as unknown as Dirent<Buffer>[]);

    statMock
      .mockResolvedValueOnce({ data: { isDirectory: () => false, isFile: () => true } })
      .mockResolvedValueOnce({ data: { isDirectory: () => true, isFile: () => false } })
      .mockResolvedValueOnce({ data: { isDirectory: () => true, isFile: () => false } })
      .mockResolvedValueOnce({ data: { isDirectory: () => false, isFile: () => true } });

    // When
    const results = await syncWalk(props);
    // Then
    expect(results).toMatchObject([
      { absolutePath: 'C:/Users/user/InternxtDrive/file1' },
      { absolutePath: 'C:/Users/user/InternxtDrive/folder1' },
      { absolutePath: 'C:/Users/user/InternxtDrive/folder2' },
      { absolutePath: 'C:/Users/user/InternxtDrive/folder1/file2' },
    ]);
  });
});
