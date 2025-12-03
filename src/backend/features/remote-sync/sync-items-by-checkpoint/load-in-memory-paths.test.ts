import { deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loadInMemoryPaths } from './load-in-memory-paths';
import { readdir } from 'node:fs/promises';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

vi.mock(import('node:fs/promises'));

describe('load-in-memory-paths', () => {
  const readdirMock = deepMocked(readdir);
  const statMock = partialSpyOn(fileSystem, 'stat');
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');

  const props = mockProps<typeof loadInMemoryPaths>({
    ctx: { rootPath: 'C:/Users/user/InternxtDrive' as AbsolutePath },
  });

  it('should iterate through folders and retrieve all files and folders with uuid', async () => {
    // Given
    readdirMock.mockResolvedValueOnce(['folder', 'file1'] as any).mockResolvedValueOnce(['file2'] as any);

    statMock
      .mockResolvedValueOnce({ data: { isDirectory: () => true, isFile: () => false } })
      .mockResolvedValueOnce({ data: { isDirectory: () => false, isFile: () => true } })
      .mockResolvedValueOnce({ data: { isDirectory: () => false, isFile: () => true } });

    getFolderInfoMock.mockReturnValueOnce({ data: { uuid: 'folderUuid' as FolderUuid } });
    getFileInfoMock.mockReturnValueOnce({}).mockReturnValueOnce({ data: { uuid: 'fileUuid2' as FileUuid } });
    // When
    const { files, folders } = await loadInMemoryPaths(props);
    // Then
    expect(folders).toStrictEqual({ folderUuid: { path: 'C:/Users/user/InternxtDrive/folder' } });
    expect(files).toMatchObject({ fileUuid2: { path: 'C:/Users/user/InternxtDrive/folder/file2' } });
  });
});
