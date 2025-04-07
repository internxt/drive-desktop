import { FileCreator } from '../../../../../src/context/virtual-drive/files/application/FileCreator';
import { FilePath } from '../../../../../src/context/virtual-drive/files/domain/FilePath';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import { FileContentsMother } from '../../contents/domain/FileContentsMother';
import { mockDeep } from 'vitest-mock-extended';
import { EventBus } from '@/context/virtual-drive/shared/domain/EventBus';
import { SyncEngineIpc } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { FileMother, generateRandomFileId } from '../domain/FileMother';
import { FolderFinder } from '@/context/virtual-drive/folders/application/FolderFinder';
import { FileDeleter } from '@/context/virtual-drive/files/application/FileDeleter';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { HttpRemoteFileSystem } from '@/context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { FolderMother } from '../../folders/domain/FolderMother';
import { v4 } from 'uuid';
import { InMemoryFolderRepository } from '@/context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';

describe('File Creator', () => {
  const remoteFileSystemMock = mockDeep<HttpRemoteFileSystem>();
  const fileRepository = mockDeep<InMemoryFileRepository>();
  const fileDeleter = mockDeep<FileDeleter>();
  const folderRepository = mockDeep<InMemoryFolderRepository>();
  const folderFinder = new FolderFinder(folderRepository);
  const eventBus = mockDeep<EventBus>();
  const ipc = mockDeep<SyncEngineIpc>();

  const SUT = new FileCreator(remoteFileSystemMock, fileRepository, folderFinder, fileDeleter, eventBus, ipc);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates the file on the drive server', async () => {
    const contents = FileContentsMother.random();

    const folderParent = FolderMother.any();
    const path = new FilePath(folderParent.path + '/cat.png');

    const file = FileMother.fromPartial({
      uuid: v4(),
      id: generateRandomFileId(),
      contentsId: contents.id,
      folderId: folderParent.id,
      folderUuid: folderParent.uuid,
      path: path.value,
    }).attributes();

    remoteFileSystemMock.persist.mockResolvedValueOnce(file);

    vi.spyOn(folderFinder, 'findFromFilePath').mockReturnValueOnce(folderParent);

    await SUT.run(path, contents);

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

    vi.spyOn(folderFinder, 'findFromFilePath').mockReturnValueOnce(folderParent);

    await SUT.run(path, contents);

    expect(eventBus.publish.mock.calls[0][0][0].eventName).toBe('file.created');
    expect(eventBus.publish.mock.calls[0][0][0].aggregateId).toBe(contents.id);
  });

  it('deletes the file on remote if it already exists on the path', async () => {
    const folderParent = FolderMother.any();
    const path = new FilePath(folderParent.path + '/cat.png');

    const existingFile = FileMother.fromPath(path.value);
    const contents = FileContentsMother.random();
    const fileAttributes = FileMother.fromPartial({
      path: path.value,
      contentsId: contents.id,
      folderId: folderParent.id,
      folderUuid: folderParent.uuid,
    }).attributes();

    fileRepository.searchByPartial.mockReturnValueOnce(existingFile).mockReturnValueOnce(existingFile);

    vi.spyOn(folderFinder, 'findFromFilePath').mockReturnValueOnce(folderParent);

    remoteFileSystemMock.persist.mockResolvedValueOnce(fileAttributes);

    await SUT.run(path, contents);

    expect(fileDeleter.run).toBeCalledWith(existingFile.contentsId);

    expect(remoteFileSystemMock.persist).toBeCalledWith(
      expect.objectContaining({
        contentsId: contents.id,
      }),
    );
    expect(fileRepository.add).toBeCalledWith(expect.objectContaining(File.from(fileAttributes)));
  });
});
