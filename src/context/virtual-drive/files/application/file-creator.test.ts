import { FileCreator } from '../../../../../src/context/virtual-drive/files/application/FileCreator';
import { HttpRemoteFileSystem } from '@/context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { GetFolderInfoError } from '@/infra/node-win/services/item-identity/get-folder-info';

vi.mock(import('@/infra/node-win/node-win.module'));
vi.mock(import('@/apps/sync-engine/ipcRendererSyncEngine'));

describe('File Creator', () => {
  const persistMock = partialSpyOn(HttpRemoteFileSystem, 'persist');
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const ipcRendererSyncEngineMock = vi.mocked(ipcRendererSyncEngine);
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');

  const contents = { id: 'contentsId' as ContentsId, size: 1024 };
  const path = abs('/file.txt');

  const props = mockProps<typeof FileCreator.run>({ contents, path });

  beforeEach(() => {
    getFolderInfoMock.mockReturnValue({ data: { uuid: 'parentUuid' as FolderUuid } });
    invokeMock.mockResolvedValue({});
  });

  it('should throw an error if placeholderId is not found', async () => {
    // Given
    getFolderInfoMock.mockReturnValue({ error: new GetFolderInfoError('NON_EXISTS') });
    // When
    const promise = FileCreator.run(props);
    // Then
    await expect(promise).rejects.toThrowError(FolderNotFoundError);

    expect(ipcRendererSyncEngineMock.send).toBeCalledWith('FILE_UPLOAD_ERROR', { path });
  });

  it('creates the file on the drive server', async () => {
    // Given
    persistMock.mockResolvedValueOnce({});
    // When
    await FileCreator.run(props);
    // Then
    expect(invokeMock).toBeCalledTimes(1);
  });
});
