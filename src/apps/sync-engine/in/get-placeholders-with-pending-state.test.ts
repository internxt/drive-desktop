import { deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { readdir } from 'fs/promises';
import { getPlaceholdersWithPendingState } from './get-placeholders-with-pending-state';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { GetFileIdentityError } from '@/infra/node-win/services/item-identity/get-file-identity';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { GetFolderIdentityError } from '@/infra/node-win/services/item-identity/get-folder-identity';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

vi.mock(import('fs/promises'));

describe('get-placeholders-with-pending-state', () => {
  const readdirMock = deepMocked(readdir);
  const getFileUuidMock = partialSpyOn(NodeWin, 'getFileUuid');
  const getFolderUuidMock = partialSpyOn(NodeWin, 'getFolderUuid');
  const statMock = partialSpyOn(fileSystem, 'stat');

  type MockReaddirReturn = ReturnType<typeof readdir> extends Promise<infer T> ? T : never;

  const props = mockProps<typeof getPlaceholdersWithPendingState>({ path: 'C:\\Users\\user\\InternxtDrive' });

  it('should return files and folders that are not uploaded', async () => {
    readdirMock.mockResolvedValueOnce(['file1', 'folder1', 'folder2'] as unknown as MockReaddirReturn);
    readdirMock.mockResolvedValueOnce(['file2'] as unknown as MockReaddirReturn);
    readdirMock.mockResolvedValueOnce([] as unknown as MockReaddirReturn);

    getFileUuidMock.mockReturnValueOnce({ data: 'uuid' as FileUuid });
    getFolderUuidMock.mockReturnValueOnce({ error: new GetFolderIdentityError('NON_EXISTS') });
    getFolderUuidMock.mockReturnValueOnce({ data: 'uuid' as FolderUuid });
    getFileUuidMock.mockReturnValueOnce({ error: new GetFileIdentityError('NON_EXISTS') });

    statMock.mockImplementation(({ absolutePath }) => {
      if (absolutePath.endsWith('folder1')) return Promise.resolve({ data: { isDirectory: () => true, isFile: () => false } });
      if (absolutePath.endsWith('folder2')) return Promise.resolve({ data: { isDirectory: () => true, isFile: () => false } });
      if (absolutePath.endsWith('file2')) return Promise.resolve({ data: { isDirectory: () => false, isFile: () => true } });
      return Promise.resolve({ data: { isDirectory: () => false, isFile: () => true } });
    });

    // When
    const { pendingFiles, pendingFolders } = await getPlaceholdersWithPendingState(props);

    // Then
    expect(pendingFiles).toStrictEqual([expect.objectContaining({ absolutePath: 'C:\\Users\\user\\InternxtDrive\\folder1\\file2' })]);
    expect(pendingFolders).toStrictEqual([expect.objectContaining({ absolutePath: 'C:\\Users\\user\\InternxtDrive\\folder1' })]);
  });
});
