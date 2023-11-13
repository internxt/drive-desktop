import { FileCreator } from '../../../../../src/context/virtual-drive/files/application/FileCreator';
import { FileDeleter } from '../../../../../src/context/virtual-drive/files/application/FileDeleter';
import { FilePath } from '../../../../../src/context/virtual-drive/files/domain/FilePath';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import { FolderFinder } from '../../../../../src/context/virtual-drive/folders/application/FolderFinder';
import { FileContentsMother } from '../../contents/domain/FileContentsMother';
import { FolderRepositoryMock } from '../../folders/__mocks__/FolderRepositoryMock';
import { FolderMother } from '../../folders/domain/FolderMother';
import { EventBusMock } from '../../shared/__mock__/EventBusMock';
import { IpcRendererSyncEngineMock } from '../../shared/__mock__/IpcRendererSyncEngineMock';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { RemoteFileSystemMock } from '../__mocks__/RemoteFileSystemMock';
import { FileMother } from '../domain/FileMother';

describe('File Creator', () => {
  let remoteFileSystemMock: RemoteFileSystemMock;
  let fileRepository: FileRepositoryMock;
  let folderRepository: FolderRepositoryMock;
  let fileDeleter: FileDeleter;
  let eventBus: EventBusMock;

  let SUT: FileCreator;

  const ipc = new IpcRendererSyncEngineMock();

  beforeEach(() => {
    remoteFileSystemMock = new RemoteFileSystemMock();

    fileRepository = new FileRepositoryMock();
    folderRepository = new FolderRepositoryMock();
    fileDeleter = {
      run: (_id: string) => {
        //no-op
      },
    } as unknown as FileDeleter;

    const folderFinder = new FolderFinder(folderRepository);
    eventBus = new EventBusMock();

    SUT = new FileCreator(
      remoteFileSystemMock,
      fileRepository,
      folderFinder,
      fileDeleter,
      eventBus,
      ipc
    );
  });

  it('creates the file on the drive server', async () => {
    const path = new FilePath('/cat.png');
    const contents = FileContentsMother.random();

    const folder = FolderMother.any();

    const fileAttributes = FileMother.fromPartial({
      path: path.value,
      contentsId: contents.id,
    }).attributes();

    folderRepository.searchByPartialMock.mockReturnValueOnce(folder);
    fileRepository.addMock.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    remoteFileSystemMock.persistMock.mockResolvedValueOnce(fileAttributes);

    await SUT.run(path, contents);

    expect(fileRepository.addMock).toBeCalledWith(
      expect.objectContaining(File.from(fileAttributes))
    );
  });

  it('once the file entry is created the creation event should have been emitted', async () => {
    const path = new FilePath('/cat.png');
    const contents = FileContentsMother.random();
    const fileAttributes = FileMother.fromPartial({
      path: path.value,
      contentsId: contents.id,
    }).attributes();

    const folder = FolderMother.any();

    folderRepository.searchByPartialMock.mockReturnValueOnce(folder);
    fileRepository.addMock.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    remoteFileSystemMock.persistMock.mockResolvedValueOnce(fileAttributes);

    await SUT.run(path, contents);

    expect(eventBus.publishMock.mock.calls[0][0][0].eventName).toBe(
      'file.created'
    );
    expect(eventBus.publishMock.mock.calls[0][0][0].aggregateId).toBe(
      contents.id
    );
  });

  it('deletes the file on remote if it already exists on the path', async () => {
    const path = new FilePath('/cat.png');
    const existingFile = FileMother.fromPath(path.value);
    const contents = FileContentsMother.random();
    const fileAttributes = FileMother.fromPartial({
      path: path.value,
      contentsId: contents.id,
    }).attributes();

    const folder = FolderMother.any();

    fileRepository.searchByPartialMock
      .mockReturnValueOnce(existingFile)
      .mockReturnValueOnce(existingFile);

    const deleterSpy = jest
      .spyOn(fileDeleter, 'run')
      .mockResolvedValueOnce(Promise.resolve());

    remoteFileSystemMock.persistMock.mockResolvedValueOnce(fileAttributes);

    folderRepository.searchByPartialMock.mockReturnValueOnce(folder);
    fileRepository.addMock.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    await SUT.run(path, contents);

    expect(deleterSpy).toBeCalledWith(existingFile.contentsId);

    expect(remoteFileSystemMock.persistMock).toBeCalledWith(
      expect.objectContaining({
        contentsId: contents.id,
      })
    );
    expect(fileRepository.addMock).toBeCalledWith(
      expect.objectContaining(File.from(fileAttributes))
    );
  });
});
