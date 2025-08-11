import { FileCreator } from '../../../../../src/context/virtual-drive/files/application/FileCreator';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { GetFolderIdentityError } from '@/infra/node-win/services/item-identity/get-folder-identity';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

vi.mock(import('@/apps/sync-engine/ipcRendererSyncEngine'));

describe('File Creator', () => {
  const getFolderUuid = partialSpyOn(NodeWin, 'getFolderUuid');
  const ipcRendererSyncEngineMock = vi.mocked(ipcRendererSyncEngine);
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');

  const path = createRelativePath('folder', 'file.txt');
  const absolutePath = 'C:/Users/user/InternxtDrive/folder/file.txt' as AbsolutePath;
  const props = mockProps<typeof FileCreator.run>({ path, absolutePath });

  beforeEach(() => {
    getFolderUuid.mockReturnValue({ data: 'parentUuid' as FolderUuid });
    invokeMock.mockResolvedValue({});
  });

  it('should throw an error if placeholderId is not found', async () => {
    // Given
    getFolderUuid.mockReturnValue({ error: new GetFolderIdentityError('NON_EXISTS') });
    // When
    const promise = FileCreator.run(props);
    // Then
    await expect(promise).rejects.toThrowError(FolderNotFoundError);
    expect(ipcRendererSyncEngineMock.send).toBeCalledWith('FILE_UPLOAD_ERROR', {
      key: 'C:/Users/user/InternxtDrive/folder/file.txt',
      nameWithExtension: 'file.txt',
    });
  });

  it('create file if placeholder id is found', async () => {
    await FileCreator.run(props);
    // Then
    expect(invokeMock).toBeCalledTimes(1);
  });
});
