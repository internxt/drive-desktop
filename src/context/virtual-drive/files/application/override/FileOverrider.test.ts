import { BucketEntryIdMother } from '../../../../../context/virtual-drive/shared/domain/__test-helpers__/BucketEntryIdMother';
import { EventBusMock } from '../../../../../context/virtual-drive/shared/__mocks__/EventBusMock';
import { FileRepositoryMock } from '../../__mocks__/FileRepositoryMock';
import { FileOverrider } from './FileOverrider';
import { FileMother } from '../../domain/__test-helpers__/FileMother';
import { FileSizeMother } from '../../domain/__test-helpers__/FileSizeMother';
import { FileNotFoundError } from '../../domain/errors/FileNotFoundError';
import { FileOverriddenDomainEvent } from '../../domain/events/FileOverriddenDomainEvent';
import * as overrideFileModule from '../../../../../infra/drive-server/services/files/services/override-file';
import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';
import { DriveServerError } from '../../../../../infra/drive-server/drive-server.error';
import { call, partialSpyOn } from '../../../../../../tests/vitest/utils.helper';

describe('File Overrider', () => {
  const overrideFileMock = partialSpyOn(overrideFileModule, 'overrideFile');

  beforeEach(() => {
    overrideFileMock.mockResolvedValue({ data: true });
  });

  it('throws an error if no file is founded with the given fileId', async () => {
    const repository = new FileRepositoryMock();
    const eventBus = new EventBusMock();

    const overrider = new FileOverrider(repository, eventBus);

    const file = FileMother.any();
    const updatedContentsId = BucketEntryIdMother.random();
    const updatedSize = FileSizeMother.random();

    repository.searchByContentsIdMock.mockReturnValueOnce(undefined);

    try {
      await overrider.run(file.path, updatedContentsId.value, updatedSize.value);
      expect.fail('it should have thrown an error');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(FileNotFoundError);
    }
  });

  it('calls the override method with the updated contentsId and size updated', async () => {
    const repository = new FileRepositoryMock();
    const eventBus = new EventBusMock();

    const overrider = new FileOverrider(repository, eventBus);

    const file = FileMother.any();
    const updatedContentsId = BucketEntryIdMother.random();
    const updatedSize = FileSizeMother.random();

    repository.searchByContentsIdMock.mockReturnValueOnce(file);

    await overrider.run(file.path, updatedContentsId.value, updatedSize.value);

    call(overrideFileMock).toStrictEqual({
      fileUuid: file.uuid,
      fileContentsId: updatedContentsId.value,
      fileSize: updatedSize.value,
    });
  });

  it('throws FILE_TOO_BIG when backend rejects the override size', async () => {
    const repository = new FileRepositoryMock();
    const eventBus = new EventBusMock();

    const overrider = new FileOverrider(repository, eventBus);

    const file = FileMother.any();
    const updatedContentsId = BucketEntryIdMother.random();
    const updatedSize = FileSizeMother.random();

    repository.searchByContentsIdMock.mockReturnValueOnce(file);
    overrideFileMock.mockResolvedValueOnce({ error: new DriveServerError('FILE_TOO_BIG', 402) });

    await expect(overrider.run(file.contentsId, updatedContentsId.value, updatedSize.value)).rejects.toMatchObject({
      cause: 'FILE_TOO_BIG',
    } satisfies Partial<DriveDesktopError>);

    expect(repository.updateMock).not.toHaveBeenCalled();
    expect(eventBus.publishMock).not.toHaveBeenCalled();
  });

  it('emits the FileOverridden domain event when successfully overridden ', async () => {
    const repository = new FileRepositoryMock();
    const eventBus = new EventBusMock();

    const overrider = new FileOverrider(repository, eventBus);

    const file = FileMother.any();
    const updatedContentsId = BucketEntryIdMother.primitive();

    repository.searchByContentsIdMock.mockReturnValueOnce(file);

    await overrider.run(file.path, updatedContentsId, FileSizeMother.primitive());

    expect(eventBus.publishMock).toBeCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          eventName: FileOverriddenDomainEvent.EVENT_NAME,
          aggregateId: file.uuid,
        }),
      ]),
    );
  });
});
