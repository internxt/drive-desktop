import { deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { readdir } from 'node:fs/promises';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { syncWalk } from './sync-walk';

vi.mock(import('node:fs/promises'));

describe('sync-walk', () => {
  const readdirMock = deepMocked(readdir);
  const statMock = partialSpyOn(fileSystem, 'stat');

  const rootFolder = abs('/drive');
  const props = mockProps<typeof syncWalk>({ rootFolder });

  it('should return files and folders', async () => {
    // Given
    readdirMock
      .mockResolvedValueOnce(['file1', 'folder1', 'folder2'] as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(['file2'] as any);

    statMock
      .mockResolvedValueOnce({ data: { isDirectory: () => false, isFile: () => true } })
      .mockResolvedValueOnce({ data: { isDirectory: () => true, isFile: () => false } })
      .mockResolvedValueOnce({ data: { isDirectory: () => true, isFile: () => false } })
      .mockResolvedValueOnce({ data: { isDirectory: () => false, isFile: () => true } });

    // When
    const results = await syncWalk(props);
    // Then
    expect(results).toMatchObject([
      { path: '/drive/file1' },
      { path: '/drive/folder1' },
      { path: '/drive/folder2' },
      { path: '/drive/folder1/file2' },
    ]);
  });
});
