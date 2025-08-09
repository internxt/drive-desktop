import { FileCreator } from '../../../../../src/context/virtual-drive/files/application/FileCreator';
import { FilePath } from '../../../../../src/context/virtual-drive/files/domain/FilePath';
import { HttpRemoteFileSystem } from '@/context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { v4 } from 'uuid';
import { FileMother, generateRandomFileId } from '@/tests/context/virtual-drive/files/domain/FileMother';
import { FileContentsMother } from '@/tests/context/__mocks__/file-contents-mother.helper.test';
import { FolderMother } from '@/tests/context/virtual-drive/folders/domain/FolderMother';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { GetFolderIdentityError } from '@/infra/node-win/services/item-identity/get-folder-identity';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

vi.mock(import('@/infra/node-win/node-win.module'));
vi.mock(import('@/apps/sync-engine/ipcRendererSyncEngine'));

describe('File Creator', () => {
  const persistMock = partialSpyOn(HttpRemoteFileSystem, 'persist');
  const getFolderUuid = vi.mocked(NodeWin.getFolderUuid);
  const ipcRendererSyncEngineMock = vi.mocked(ipcRendererSyncEngine);
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');

  const folderParent = FolderMother.any();
  const filePath = new FilePath(folderParent.path + '/cat.png');
  const contents = FileContentsMother.random();
  const absolutePath = 'C:\\Users\\user\\InternxtDrive\\cat.png' as AbsolutePath;

  beforeEach(() => {
    getFolderUuid.mockReturnValue({ data: folderParent.uuid as FolderUuid });
    invokeMock.mockResolvedValue({});
  });

  it('should throw an error if placeholderId is not found', async () => {
    // Given
    getFolderUuid.mockReturnValue({ error: new GetFolderIdentityError('NON_EXISTS') });

    // When
    const props = mockProps<typeof FileCreator.run>({ filePath, contents, absolutePath });
    const promise = FileCreator.run(props);

    // Then
    await expect(promise).rejects.toThrowError(FolderNotFoundError);

    expect(ipcRendererSyncEngineMock.send).toBeCalledWith('FILE_UPLOAD_ERROR', {
      key: 'C:\\Users\\user\\InternxtDrive\\cat.png',
      nameWithExtension: filePath.nameWithExtension(),
    });
  });

  it('creates the file on the drive server', async () => {
    const file = FileMother.fromPartial({
      uuid: v4(),
      id: generateRandomFileId(),
      contentsId: contents.id,
      folderId: folderParent.id,
      folderUuid: folderParent.uuid,
      path: filePath.value,
    }).attributes();

    persistMock.mockResolvedValueOnce({
      ...file,
      dto: { size: '1024' },
    } as any);

    const props = mockProps<typeof FileCreator.run>({ filePath, contents, absolutePath });
    await FileCreator.run(props);

    expect(invokeMock).toBeCalledTimes(1);
  });

  it('once the file entry is created the creation event should have been emitted', async () => {
    const folderParent = FolderMother.any();
    const path = new FilePath(folderParent.path + '/cat.png');

    const contents = FileContentsMother.random();
    const fileAttributes = FileMother.fromPartial({
      path: path.value,
      contentsId: contents.id,
      folderId: folderParent.id,
      folderUuid: folderParent.uuid,
    }).attributes();

    persistMock.mockResolvedValueOnce({
      ...fileAttributes,
      dto: { size: '1024' },
    } as any);

    const props = mockProps<typeof FileCreator.run>({ filePath, contents, absolutePath });
    await FileCreator.run(props);

    expect(invokeMock).toBeCalledTimes(1);
  });
});
