import { FileCreator } from '../../../../../src/context/virtual-drive/files/application/FileCreator';
import { FilePath } from '../../../../../src/context/virtual-drive/files/domain/FilePath';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import { FileContentsMother } from '../../contents/domain/FileContentsMother.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import { EventBus } from '@/context/virtual-drive/shared/domain/EventBus';
import { SyncEngineIpc } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { FileMother } from '../domain/FileMother.helper.test';
import { FolderFinder } from '@/context/virtual-drive/folders/application/FolderFinder';
import { FolderRepository } from '@/context/virtual-drive/folders/domain/FolderRepository';
import { FileDeleter } from '@/context/virtual-drive/files/application/FileDeleter';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { SDKRemoteFileSystem } from '@/context/virtual-drive/files/infrastructure/SDKRemoteFileSystem';

describe('File Creator', () => {
  const remoteFileSystemMock = mockDeep<SDKRemoteFileSystem>();
  const fileRepository = mockDeep<InMemoryFileRepository>();
  const fileDeleter = mockDeep<FileDeleter>();
  const folderRepository = mockDeep<FolderRepository>();
  const folderFinder = new FolderFinder(folderRepository);
  const eventBus = mockDeep<EventBus>();
  const ipc = mockDeep<SyncEngineIpc>();

  const SUT = new FileCreator(remoteFileSystemMock, fileRepository, folderFinder, fileDeleter, eventBus, ipc);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.only('creates the file on the drive server', async () => {
    const path = new FilePath('/cat.png');
    const contents = FileContentsMother.random();

    const fileAttributes = FileMother.fromPartial({
      path: path.value,
      contentsId: contents.id,
    }).attributes();

    fileRepository.add.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    remoteFileSystemMock.persist.mockResolvedValueOnce(fileAttributes);

    await SUT.run(path, contents);

    expect(fileRepository.add).toBeCalledWith(expect.objectContaining(File.from(fileAttributes)));
  });

  it('once the file entry is created the creation event should have been emitted', async () => {
    const path = new FilePath('/cat.png');
    const contents = FileContentsMother.random();
    const fileAttributes = FileMother.fromPartial({
      path: path.value,
      contentsId: contents.id,
    }).attributes();

    fileRepository.add.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    remoteFileSystemMock.persist.mockResolvedValueOnce(fileAttributes);

    await SUT.run(path, contents);

    expect(eventBus.publish.mock.calls[0][0][0].eventName).toBe('file.created');
    expect(eventBus.publish.mock.calls[0][0][0].aggregateId).toBe(contents.id);
  });

  it('deletes the file on remote if it already exists on the path', async () => {
    const path = new FilePath('/cat.png');
    const existingFile = FileMother.fromPath(path.value);
    const contents = FileContentsMother.random();
    const fileAttributes = FileMother.fromPartial({
      path: path.value,
      contentsId: contents.id,
    }).attributes();

    fileRepository.searchByPartial.mockReturnValueOnce(existingFile).mockReturnValueOnce(existingFile);

    remoteFileSystemMock.persist.mockResolvedValueOnce(fileAttributes);

    fileRepository.add.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    await SUT.run(path, contents);

    expect(fileDeleter.run).toBeCalledWith(existingFile.contentsId);

    expect(remoteFileSystemMock.persist).toBeCalledWith(
      expect.objectContaining({
        contentsId: contents.id,
      })
    );
    expect(fileRepository.add).toBeCalledWith(expect.objectContaining(File.from(fileAttributes)));
  });
});
