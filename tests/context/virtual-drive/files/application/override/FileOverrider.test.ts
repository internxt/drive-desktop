import { FileOverrider } from '../../../../../../src/context/virtual-drive/files/application/override/FileOverrider';
import { FileNotFoundError } from '../../../../../../src/context/virtual-drive/files/domain/errors/FileNotFoundError';
import { FileOverriddenDomainEvent } from '../../../../../../src/context/virtual-drive/files/domain/events/FileOverriddenDomainEvent';
import { ContentsIdMother } from '../../../contents/domain/ContentsIdMother';
import { EventBusMock } from '../../../shared/__mock__/EventBusMock';
import { FileRepositoryMock } from '../../__mocks__/FileRepositoryMock';
import { RemoteFileSystemMock } from '../../__mocks__/RemoteFileSystemMock';
import { FileMother } from '../../domain/FileMother';
import { FileSizeMother } from '../../domain/FileSizeMother';

describe('File Overrider', () => {
  it('throws an error if no file is founded with the given fileId', async () => {
    const rfs = new RemoteFileSystemMock();
    const repository = new FileRepositoryMock();
    const eventBus = new EventBusMock();

    const overrider = new FileOverrider(rfs, repository, eventBus);

    const file = FileMother.any();
    const updatedContentsId = ContentsIdMother.random();
    const updatedSize = FileSizeMother.random();

    repository.searchByContentsIdMock.mockReturnValueOnce(undefined);

    try {
      await overrider.run(
        file.path,
        updatedContentsId.value,
        updatedSize.value
      );
      fail('it should have thrown an error');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(FileNotFoundError);
    }
  });

  it('calls the override method with the updated contentsId and size updated', async () => {
    const rfs = new RemoteFileSystemMock();
    const repository = new FileRepositoryMock();
    const eventBus = new EventBusMock();

    const overrider = new FileOverrider(rfs, repository, eventBus);

    const file = FileMother.any();
    const updatedContentsId = ContentsIdMother.random();
    const updatedSize = FileSizeMother.random();

    repository.searchByContentsIdMock.mockReturnValueOnce(file);

    await overrider.run(file.path, updatedContentsId.value, updatedSize.value);

    expect(rfs.overrideMock).toBeCalledWith(
      expect.objectContaining({
        _id: file.id,
        _contentsId: updatedContentsId,
        _size: updatedSize,
      })
    );
  });

  it('emits the FileOverridden domain event when successfully overridden ', async () => {
    const rfs = new RemoteFileSystemMock();
    const repository = new FileRepositoryMock();
    const eventBus = new EventBusMock();

    const overrider = new FileOverrider(rfs, repository, eventBus);

    const file = FileMother.any();
    const updatedContentsId = ContentsIdMother.primitive();

    repository.searchByContentsIdMock.mockReturnValueOnce(file);

    await overrider.run(
      file.path,
      updatedContentsId,
      FileSizeMother.primitive()
    );

    expect(eventBus.publishMock).toBeCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          eventName: FileOverriddenDomainEvent.EVENT_NAME,
          aggregateId: file.uuid,
        }),
      ])
    );
  });
});
