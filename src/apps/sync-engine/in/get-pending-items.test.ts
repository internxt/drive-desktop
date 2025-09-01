import { deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { readdir } from 'fs/promises';
import { getPendingItems } from './get-pending-items';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { GetFileIdentityError } from '@/infra/node-win/services/item-identity/get-file-identity';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { GetFolderIdentityError } from '@/infra/node-win/services/item-identity/get-folder-identity';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Dirent } from 'fs';

vi.mock(import('fs/promises'));

describe('get-pending-items', () => {
  const readdirMock = deepMocked(readdir);
  const statMock = partialSpyOn(fileSystem, 'stat');
  const getFileUuidMock = partialSpyOn(NodeWin, 'getFileUuid');
  const getFolderUuidMock = partialSpyOn(NodeWin, 'getFolderUuid');

  const rootFolder = 'C:\\Users\\user\\InternxtDrive';
  const props = mockProps<typeof getPendingItems>({ path: rootFolder });

  it('should return files and folders that are not uploaded', async () => {
    readdirMock
      .mockResolvedValueOnce(['file1', 'folder1', 'folder2'] as unknown as Dirent<Buffer>[])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(['file2'] as unknown as Dirent<Buffer>[]);

    statMock
      .mockResolvedValueOnce({ data: { isDirectory: () => false, isFile: () => true } })
      .mockResolvedValueOnce({ data: { isDirectory: () => true, isFile: () => false } })
      .mockResolvedValueOnce({ data: { isDirectory: () => true, isFile: () => false } })
      .mockResolvedValueOnce({ data: { isDirectory: () => false, isFile: () => true } });

    getFileUuidMock
      .mockReturnValueOnce({ data: 'uuid' as FileUuid })
      .mockReturnValueOnce({ error: new GetFileIdentityError('NON_EXISTS') });

    getFolderUuidMock
      .mockReturnValueOnce({ error: new GetFolderIdentityError('NON_EXISTS') })
      .mockReturnValueOnce({ data: 'uuid' as FolderUuid });

    // When
    const { pendingFiles, pendingFolders } = await getPendingItems(props);

    // Then
    expect(pendingFiles).toMatchObject([{ absolutePath: 'C:\\Users\\user\\InternxtDrive\\folder1\\file2' }]);
    expect(pendingFolders).toMatchObject([{ absolutePath: 'C:\\Users\\user\\InternxtDrive\\folder1' }]);
  });
});
