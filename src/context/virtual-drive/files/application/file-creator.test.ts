import { FileCreator } from '../../../../../src/context/virtual-drive/files/application/FileCreator';
import { FilePath } from '../../../../../src/context/virtual-drive/files/domain/FilePath';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import { mockDeep } from 'vitest-mock-extended';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { HttpRemoteFileSystem } from '@/context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { v4 } from 'uuid';
import { FileMother, generateRandomFileId } from '@/tests/context/virtual-drive/files/domain/FileMother';
import { FileContentsMother } from '@/tests/context/__mocks__/file-contents-mother.helper.test';
import VirtualDrive from '@/node-win/virtual-drive';
import { FolderMother } from '@/tests/context/virtual-drive/folders/domain/FolderMother';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { GetFolderIdentityError } from '@/infra/node-win/services/item-identity/get-folder-identity';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

vi.mock(import('@/infra/node-win/node-win.module'));
vi.mock(import('@/apps/sync-engine/ipcRendererSyncEngine'));

describe('File Creator', () => {
  const remoteFileSystemMock = mockDeep<HttpRemoteFileSystem>();
  const fileRepository = mockDeep<InMemoryFileRepository>();
  const virtualDriveMock = mockDeep<VirtualDrive>();
  const getFolderUuid = vi.mocked(NodeWin.getFolderUuid);
  const ipcRendererSyncEngineMock = vi.mocked(ipcRendererSyncEngine);

  const folderParent = FolderMother.any();
  const filePath = new FilePath(folderParent.path + '/cat.png');
  const contents = FileContentsMother.random();

  const SUT = new FileCreator(remoteFileSystemMock, fileRepository, virtualDriveMock);

  beforeEach(() => {
    vi.resetAllMocks();
    getFolderUuid.mockReturnValue({ data: folderParent.uuid as FolderUuid });
  });

  it('should throw an error if placeholderId is not found', async () => {
    // Given
    getFolderUuid.mockReturnValue({ error: new GetFolderIdentityError('NON_EXISTS') });

    // When
    const promise = SUT.run(filePath, contents);

    // Then
    await expect(promise).rejects.toThrowError(FolderNotFoundError);

    expect(ipcRendererSyncEngineMock.send).toBeCalledWith('FILE_UPLOAD_ERROR', {
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

    remoteFileSystemMock.persist.mockResolvedValueOnce(file);

    await SUT.run(filePath, contents);

    expect(fileRepository.add).toBeCalledWith(expect.objectContaining(File.from(file)));
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

    remoteFileSystemMock.persist.mockResolvedValueOnce(fileAttributes);

    await SUT.run(filePath, contents);

    expect(ipcRendererSyncEngineMock.send).toBeCalledWith('FILE_CREATED', {
      bucket: '',
      name: 'cat',
      extension: 'png',
      nameWithExtension: 'cat.png',
      fileId: fileAttributes.id,
      path: fileAttributes.path,
    });
  });
});
