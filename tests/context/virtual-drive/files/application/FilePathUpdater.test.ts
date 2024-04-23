import { FilePathUpdater } from '../../../../../src/context/virtual-drive/files/application/move/FilePathUpdater';
import { FilePath } from '../../../../../src/context/virtual-drive/files/domain/FilePath';
import { ParentFolderFinder } from '../../../../../src/context/virtual-drive/folders/application/ParentFolderFinder';
import { ParentFolderFinderTestClass } from '../../folders/__test-class__/ParentFolderFinderTestClass';
import { FolderMother } from '../../folders/domain/FolderMother';
import { EventBusMock } from '../../shared/__mock__/EventBusMock';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { RemoteFileSystemMock } from '../__mocks__/RemoteFileSystemMock';
import { SingleFileMatchingTestClass } from '../__test-class__/SingleFileMatchingTestClass';
import { FileMother } from '../domain/FileMother';

describe('File path updater', () => {
  let repository: FileRepositoryMock;
  let folderFinder: ParentFolderFinderTestClass;
  let singleFileMatchingTestClass: SingleFileMatchingTestClass;
  let eventBus: EventBusMock;
  let remoteFileSystemMock: RemoteFileSystemMock;
  let SUT: FilePathUpdater;

  beforeEach(() => {
    repository = new FileRepositoryMock();
    folderFinder = new ParentFolderFinderTestClass();
    singleFileMatchingTestClass = new SingleFileMatchingTestClass();
    eventBus = new EventBusMock();
    remoteFileSystemMock = new RemoteFileSystemMock();

    SUT = new FilePathUpdater(
      remoteFileSystemMock,
      repository,
      singleFileMatchingTestClass,
      folderFinder as unknown as ParentFolderFinder,
      eventBus
    );
  });

  it('renames a file when the extension and folder does not change', async () => {
    const fileToRename = FileMother.any();

    singleFileMatchingTestClass.mock.mockReturnValueOnce(fileToRename);
    repository.matchingPartialMock.mockReturnValueOnce([]);

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

    singleFileMatchingTestClass.mock
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

    singleFileMatchingTestClass.mock
      .mockReturnValueOnce(fileToMove)
      .mockReturnValueOnce(fileInDestination);

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
