import { FilePathUpdater } from '../../application/FilePathUpdater';
import { FilePath } from '../../domain/FilePath';
import { FileMother } from '../domain/FileMother';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { FolderFinder } from '../../../folders/application/FolderFinder';
import { FolderFinderMock } from '../../../folders/test/__mocks__/FolderFinderMock';
import { FileFinderByContentsId } from '../../application/FileFinderByContentsId';
import { IpcRendererSyncEngineMock } from '../../../shared/test/__mock__/IpcRendererSyncEngineMock';
import { LocalFileIdProvider } from '../../../shared/application/LocalFileIdProvider';
import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { RemoteFileSystemMock } from '../__mocks__/RemoteFileSystemMock';

describe('File path updater', () => {
  let repository: FileRepositoryMock;
  let fileFinderByContentsId: FileFinderByContentsId;
  let folderFinder: FolderFinderMock;
  let ipcRendererMock: IpcRendererSyncEngineMock;
  let localFileIdProvider: LocalFileIdProvider;
  let eventBus: EventBusMock;
  let remoteFileSystemMock: RemoteFileSystemMock;
  let SUT: FilePathUpdater;

  beforeEach(() => {
    repository = new FileRepositoryMock();
    folderFinder = new FolderFinderMock();
    fileFinderByContentsId = new FileFinderByContentsId(repository);
    ipcRendererMock = new IpcRendererSyncEngineMock();
    eventBus = new EventBusMock();
    remoteFileSystemMock = new RemoteFileSystemMock();

    SUT = new FilePathUpdater(
      remoteFileSystemMock,
      repository,
      fileFinderByContentsId,
      folderFinder as unknown as FolderFinder,
      ipcRendererMock,
      localFileIdProvider,
      eventBus
    );
  });

  it('when the extension does not changes it updates the name of the file', async () => {
    const file = FileMother.any();

    repository.searchByPartialMock.mockReturnValue(file);

    const destination = new FilePath(
      `${file.dirname}/_${file.nameWithExtension}`
    );

    await SUT.run(file.contentsId, destination.value);

    expect(repository.updateMock).toBeCalledWith(expect.objectContaining(file));
  });
});
