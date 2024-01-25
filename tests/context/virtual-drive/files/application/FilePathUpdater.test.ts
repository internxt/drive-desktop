import { FileFinderByContentsId } from '../../../../../src/context/virtual-drive/files/application/FileFinderByContentsId';
import { FilePathUpdater } from '../../../../../src/context/virtual-drive/files/application/FilePathUpdater';
import { FilePath } from '../../../../../src/context/virtual-drive/files/domain/FilePath';
import { FolderFinder } from '../../../../../src/context/virtual-drive/folders/application/FolderFinder';
import { FolderFinderMock } from '../../folders/__mocks__/FolderFinderMock';
import { FolderMother } from '../../folders/domain/FolderMother';
import { EventBusMock } from '../../shared/__mock__/EventBusMock';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { LocalFileSystemMock } from '../__mocks__/LocalFileSystemMock';
import { RemoteFileSystemMock } from '../__mocks__/RemoteFileSystemMock';
import { FileMother } from '../domain/FileMother';

describe('File path updater', () => {
  let repository: FileRepositoryMock;
  let fileFinderByContentsId: FileFinderByContentsId;
  let folderFinder: FolderFinderMock;
  let localFileSystem: LocalFileSystemMock;
  let eventBus: EventBusMock;
  let remoteFileSystemMock: RemoteFileSystemMock;
  let SUT: FilePathUpdater;

  beforeEach(() => {
    repository = new FileRepositoryMock();
    folderFinder = new FolderFinderMock();
    fileFinderByContentsId = new FileFinderByContentsId(repository);
    eventBus = new EventBusMock();
    remoteFileSystemMock = new RemoteFileSystemMock();
    localFileSystem = new LocalFileSystemMock();

    SUT = new FilePathUpdater(
      remoteFileSystemMock,
      localFileSystem,
      repository,
      fileFinderByContentsId,
      folderFinder as unknown as FolderFinder,
      eventBus
    );
  });

  it('renames a file when the extension and folder does not change', async () => {
    const fileToRename = FileMother.any();
    const fileWithDestinationPath = undefined;

    repository.searchByPartialMock
      .mockReturnValueOnce(fileToRename)
      .mockReturnValueOnce(fileWithDestinationPath);

    const destination = new FilePath(
      `${fileToRename.dirname}/_${fileToRename.nameWithExtension}`
    );

    await SUT.run(fileToRename.contentsId, destination.value);

    expect(repository.updateMock).toBeCalledWith(
      expect.objectContaining({ path: destination.value })
    );
    expect(remoteFileSystemMock.renameMock).toBeCalledWith(
      expect.objectContaining({ path: destination.value })
    );
  });

  it('does not rename or moves a file when the extension changes', async () => {
    const fileToRename = FileMother.any();
    const fileWithDestinationPath = undefined;

    repository.searchByPartialMock
      .mockReturnValueOnce(fileToRename)
      .mockReturnValueOnce(fileWithDestinationPath);

    const destination = new FilePath(
      `${fileToRename.dirname}/_${fileToRename.nameWithExtension}n`
    );

    expect(async () => {
      await SUT.run(fileToRename.contentsId, destination.value);
    }).rejects.toThrow();
  });

  it('moves a file when the folder changes', async () => {
    const fileToMove = FileMother.any();
    const fileInDestination = undefined;
    const localFileId = '1-2';

    repository.searchByPartialMock
      .mockReturnValueOnce(fileToMove)
      .mockReturnValueOnce(fileInDestination);

    localFileSystem.getLocalFileIdMock.mockResolvedValueOnce(localFileId);

    const destination = new FilePath(
      `${fileToMove.dirname}_/${fileToMove.nameWithExtension}`
    );

    const destinationFolder = FolderMother.fromPartial({
      id: fileToMove.folderId + 1,
      path: destination.dirname(),
    });

    folderFinder.mock.mockReturnValueOnce(destinationFolder);

    await SUT.run(fileToMove.contentsId, destination.value);

    expect(repository.updateMock).toBeCalledWith(
      expect.objectContaining({
        folderId: destinationFolder.id,
        path: destination.value,
      })
    );
    expect(remoteFileSystemMock.moveMock).toBeCalledWith(
      expect.objectContaining({
        folderId: destinationFolder.id,
        path: destination.value,
      })
    );
  });
});
