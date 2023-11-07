import { FolderMother } from '../../../folders/test/domain/FolderMother';
import { FolderRepositoryMock } from '../../../folders/test/__mocks__/FolderRepositoryMock';
import { FolderFinder } from '../../../folders/application/FolderFinder';
import { FileCreator } from '../../application/FileCreator';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { FilePath } from '../../domain/FilePath';
import { FileContentsMother } from '../../../contents/test/domain/FileContentsMother';
import { FileDeleter } from '../../application/FileDeleter';
import { AllParentFoldersStatusIsExists } from '../../../folders/application/AllParentFoldersStatusIsExists';
import { IpcRendererSyncEngineMock } from '../../../shared/test/__mock__/IpcRendererSyncEngineMock';
import { FileMother } from '../domain/FileMother';
import { RemoteFileSystemMock } from '../__mocks__/RemoteFileSystemMock';
import { LocalFileSystemMock } from '../__mocks__/LocalFileSystemMock';
describe('File Creator', () => {
  let remoteFileSystemMock: RemoteFileSystemMock;
  let localFileSystemMock: LocalFileSystemMock;

  let fileRepository: FileRepositoryMock;
  let folderRepository: FolderRepositoryMock;
  let fileDeleter: FileDeleter;
  let eventBus: EventBusMock;

  let SUT: FileCreator;

  const ipc = new IpcRendererSyncEngineMock();

  beforeEach(() => {
    remoteFileSystemMock = new RemoteFileSystemMock();
    localFileSystemMock = new LocalFileSystemMock();

    fileRepository = new FileRepositoryMock();
    folderRepository = new FolderRepositoryMock();
    const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(
      folderRepository
    );

    fileDeleter = new FileDeleter(
      remoteFileSystemMock,
      localFileSystemMock,
      fileRepository,
      allParentFoldersStatusIsExists,
      ipc
    );

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

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    fileRepository.addMock.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    await SUT.run(path, contents);

    expect(fileRepository.addMock.mock.calls[0][0].contentsId).toBe(
      contents.id
    );
    expect(fileRepository.addMock.mock.calls[0][0].size).toStrictEqual(
      contents.size
    );
    expect(fileRepository.addMock.mock.calls[0][0].folderId).toBe(folder.id);
  });

  it('once the file entry is created the creation event should have been emitted', async () => {
    const path = new FilePath('/cat.png');
    const contents = FileContentsMother.random();

    const folder = FolderMother.any();

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    fileRepository.addMock.mockImplementationOnce(() => {
      // returns Promise<void>
    });

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

    const folder = FolderMother.any();

    fileRepository.searchByPartialMock
      .mockReturnValueOnce(existingFile)
      .mockReturnValueOnce(existingFile);

    folderRepository.mockSearchByPartial.mockReturnValueOnce(folder);
    fileRepository.deleteMock.mockImplementationOnce(() => {
      // returns Promise<void>
    });
    folderRepository.mockSearch.mockReturnValueOnce(folder);
    fileRepository.addMock.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    await SUT.run(path, contents);

    expect(fileRepository.deleteMock.mock.calls[0][0].contentsId).toBe(
      existingFile.contentsId
    );
    expect(fileRepository.addMock.mock.calls[0][0].contentsId).toBe(
      contents.id
    );
  });
});
