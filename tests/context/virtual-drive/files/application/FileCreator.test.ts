import { FileCreator } from '../../../../../src/context/virtual-drive/files/application/FileCreator';
import { FileDeleter } from '../../../../../src/context/virtual-drive/files/application/FileDeleter';
import { FilePath } from '../../../../../src/context/virtual-drive/files/domain/FilePath';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import { FileContentsMother } from '../../contents/domain/FileContentsMother';
import { EventBusMock } from '../../shared/__mock__/EventBusMock';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { RemoteFileSystemMock } from '../__mocks__/RemoteFileSystemMock';
import { FileMother } from '../domain/FileMother';
import { FolderFinderFactory } from '../../folders/__mocks__/FolderFinderFactory';
import { FileDeleterFactory } from '../__mocks__/FileDeleterFactory';

describe('File Creator', () => {
  let remoteFileSystemMock: RemoteFileSystemMock;
  let fileRepository: FileRepositoryMock;
  let fileDeleter: FileDeleter;
  let eventBus: EventBusMock;

  let SUT: FileCreator;

  beforeEach(() => {
    remoteFileSystemMock = new RemoteFileSystemMock();
    fileRepository = new FileRepositoryMock();
    fileDeleter = FileDeleterFactory.deletionSucces();
    const folderFinder = FolderFinderFactory.existingFolder();
    eventBus = new EventBusMock();

    SUT = new FileCreator(
      remoteFileSystemMock,
      fileRepository,
      folderFinder,
      fileDeleter,
      eventBus
    );
  });

  it('creates the file on the drive server', async () => {
    const path = new FilePath('/cat.png');
    const contents = FileContentsMother.random();

    const fileAttributes = FileMother.fromPartial({
      path: path.value,
      contentsId: contents.id,
    }).attributes();

    fileRepository.addMock.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    remoteFileSystemMock.persistMock.mockResolvedValueOnce(fileAttributes);

    await SUT.run(path.value, contents.id, contents.size);

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

    fileRepository.addMock.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    remoteFileSystemMock.persistMock.mockResolvedValueOnce(fileAttributes);

    await SUT.run(path.value, contents.id, contents.size);

    expect(eventBus.publishMock.mock.calls[0][0][0].eventName).toBe(
      'file.created'
    );
    expect(eventBus.publishMock.mock.calls[0][0][0].aggregateId).toBe(
      contents.id
    );
  });

  it('deletes the file on remote if it already exists on the path', async () => {
    const path = new FilePath('/cat.png');
    const existingFile = FileMother.fromPartial({ path: path.value });
    const contents = FileContentsMother.random();
    const fileAttributes = FileMother.fromPartial({
      path: path.value,
      contentsId: contents.id,
    }).attributes();

    fileRepository.searchByPartialMock
      .mockReturnValueOnce(existingFile)
      .mockReturnValueOnce(existingFile);

    const deleterSpy = jest
      .spyOn(fileDeleter, 'run')
      .mockResolvedValueOnce(Promise.resolve());

    remoteFileSystemMock.persistMock.mockResolvedValueOnce(fileAttributes);

    fileRepository.addMock.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    await SUT.run(path.value, contents.id, contents.size);

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
