import { BucketEntryIdMother } from '../../../../../context/virtual-drive/shared/domain/__test-helpers__/BucketEntryIdMother';
import { FileCreator } from './FileCreator';
import { FileTrasher } from '../trash/FileTrasher';
import { FileContentsId } from '../../domain/FileContentsId';
import { FilePath } from '../../domain/FilePath';
import { FolderFinderFactory } from '../../../folders/__mocks__/FolderFinderFactory';
import { FileDeleterFactory } from '../../__mocks__/FileDeleterFactory';
import { FileRepositoryMock } from '../../__mocks__/FileRepositoryMock';
import { FileSyncNotifierMock } from '../../__mocks__/FileSyncNotifierMock';
import { RemoteFileSystemMock } from '../../__mocks__/RemoteFileSystemMock';
import { FileMother } from '../../domain/__test-helpers__/FileMother';
import { FileSizeMother } from '../../domain/__test-helpers__/FileSizeMother';
import { right } from '../../../../shared/domain/Either';
import { EventBusMock } from '../../../../../context/virtual-drive/shared/__mocks__/EventBusMock';

describe('File Creator', () => {
  let remoteFileSystemMock: RemoteFileSystemMock;
  let fileRepository: FileRepositoryMock;
  let fileDeleter: FileTrasher;
  let eventBus: EventBusMock;
  let notifier: FileSyncNotifierMock;

  let SUT: FileCreator;

  beforeEach(() => {
    remoteFileSystemMock = new RemoteFileSystemMock();
    fileRepository = new FileRepositoryMock();
    fileDeleter = FileDeleterFactory.deletionSuccess();
    const parentFolderFinder = FolderFinderFactory.existingFolder();
    eventBus = new EventBusMock();
    notifier = new FileSyncNotifierMock();

    SUT = new FileCreator(remoteFileSystemMock, fileRepository, parentFolderFinder, fileDeleter, eventBus, notifier);
  });

  it('creates the file on the drive server', async () => {
    const path = new FilePath('/cat.png');
    const contentsId = BucketEntryIdMother.random();
    const size = FileSizeMother.random();

    const fileAttributes = FileMother.fromPartial({
      path: path.value,
      contentsId: contentsId.value,
    }).attributes();

    fileRepository.addMock.mockImplementationOnce(() => Promise.resolve());

    remoteFileSystemMock.persistMock.mockResolvedValueOnce(right(fileAttributes));

    await SUT.run(path.value, contentsId.value, size.value);

    expect(fileRepository.addMock).toBeCalledWith(
      expect.objectContaining({
        _contentsId: new FileContentsId(fileAttributes.contentsId),
      }),
    );
  });

  it('once the file entry is created the creation event should have been emitted', async () => {
    const path = new FilePath('/cat.png');
    const contentsId = BucketEntryIdMother.random();
    const size = FileSizeMother.random();
    const fileAttributes = FileMother.fromPartial({
      path: path.value,
      contentsId: contentsId.value,
    }).attributes();

    fileRepository.addMock.mockImplementationOnce(() => Promise.resolve());

    remoteFileSystemMock.persistMock.mockResolvedValueOnce(right(fileAttributes));

    await SUT.run(path.value, contentsId.value, size.value);

    expect(eventBus.publishMock.mock.calls[0][0][0].eventName).toBe('file.created');
    expect(eventBus.publishMock.mock.calls[0][0][0].aggregateId).toBe(fileAttributes.uuid);
  });

  it('deletes the file on remote if it already exists on the path', async () => {
    const path = new FilePath('/cat.png');
    const existingFile = FileMother.fromPartial({ path: path.value });
    const contentsId = BucketEntryIdMother.random();
    const size = FileSizeMother.random();
    const fileAttributes = FileMother.fromPartial({
      path: path.value,
      contentsId: contentsId.value,
    }).attributes();

    fileRepository.matchingPartialMock.mockReturnValueOnce([existingFile]).mockReturnValueOnce([existingFile]);

    const deleterSpy = vi.spyOn(fileDeleter, 'run').mockResolvedValueOnce();

    remoteFileSystemMock.persistMock.mockResolvedValueOnce(right(fileAttributes));

    fileRepository.addMock.mockImplementationOnce(() => Promise.resolve());

    await SUT.run(path.value, contentsId.value, size.value);

    expect(deleterSpy).toBeCalledWith(existingFile.contentsId);

    expect(remoteFileSystemMock.persistMock).toBeCalledWith(
      expect.objectContaining({
        contentsId: contentsId,
      }),
    );
    expect(fileRepository.addMock).toBeCalledWith(
      expect.objectContaining({
        _contentsId: new FileContentsId(fileAttributes.contentsId),
      }),
    );
  });
});
