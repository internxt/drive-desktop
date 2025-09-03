import { FileCreator } from '../../../../../src/context/virtual-drive/files/application/FileCreator';
import { mockDeep } from 'vitest-mock-extended';
import { HttpRemoteFileSystem } from '@/context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { v4 } from 'uuid';
import VirtualDrive from '@/node-win/virtual-drive';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { GetFolderIdentityError } from '@/infra/node-win/services/item-identity/get-folder-identity';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';

vi.mock(import('@/infra/node-win/node-win.module'));
vi.mock(import('@/apps/sync-engine/ipcRendererSyncEngine'));

describe('File Creator', () => {
  const remoteFileSystemMock = mockDeep<HttpRemoteFileSystem>();
  const virtualDrive = mockDeep<VirtualDrive>();
  const getFolderUuid = vi.mocked(NodeWin.getFolderUuid);
  const ipcRendererSyncEngineMock = vi.mocked(ipcRendererSyncEngine);
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');

  const path = createRelativePath('folder', 'cat.png');
  const contents = { id: 'contentsId' as ContentsId, size: 1024 };
  const absolutePath = 'C:\\Users\\user\\InternxtDrive\\cat.png' as AbsolutePath;

  const SUT = new FileCreator(remoteFileSystemMock);

  const props = mockProps<typeof SUT.run>({ ctx: { virtualDrive }, path, contents, absolutePath });

  beforeEach(() => {
    getFolderUuid.mockReturnValue({ data: 'parentUuid' as FolderUuid });
    invokeMock.mockResolvedValue({});
  });

  it('should throw an error if placeholderId is not found', async () => {
    // Given
    getFolderUuid.mockReturnValue({ error: new GetFolderIdentityError('NON_EXISTS') });

    // When
    const promise = SUT.run(props);

    // Then
    await expect(promise).rejects.toThrowError(FolderNotFoundError);

    expect(ipcRendererSyncEngineMock.send).toBeCalledWith('FILE_UPLOAD_ERROR', {
      key: 'C:\\Users\\user\\InternxtDrive\\cat.png',
      nameWithExtension: 'cat.png',
    });
  });

  it('creates the file on the drive server', async () => {
    const file = {
      uuid: v4(),
      contentsId: contents.id,
      path: 'cat.png',
    };

    remoteFileSystemMock.persist.mockResolvedValueOnce({
      ...file,
    } as any);

    await SUT.run(props);

    expect(invokeMock).toBeCalledTimes(1);
  });

  it('once the file entry is created the creation event should have been emitted', async () => {
    const fileAttributes = {
      path,
      contentsId: contents.id,
    };

    remoteFileSystemMock.persist.mockResolvedValueOnce({
      ...fileAttributes,
    } as any);

    await SUT.run(props);

    expect(invokeMock).toBeCalledTimes(1);
  });
});
