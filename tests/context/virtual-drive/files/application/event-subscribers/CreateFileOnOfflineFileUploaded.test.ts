import { CreateFileOnOfflineFileUploaded } from '../../../../../../src/context/virtual-drive/files/application/event-subsribers/CreateFileOnOfflineFileUplodaded';
import { Optional } from '../../../../../../src/shared/types/Optional';
import { FileCreatorTestClass } from '../../__test-class__/FileCreatorTestClass';
import { FileOverriderTestClass } from '../../__test-class__/FileOverriderTestClass';
import { FileToOverrideProviderTestClass } from '../../__test-class__/FileToOverrideProviderTestClass';
import { FileMother } from '../../domain/FileMother';
import { OfflineContentsUploadedDomainEventMother } from '../../domain/events/OfflineContentsUploadedDomainEventMother';

describe('Create File On Offline File Uploaded', () => {
  it('creates a new file when no file to be overridden is found', async () => {
    const creator = new FileCreatorTestClass();
    const toOverride = new FileToOverrideProviderTestClass();
    const overrider = new FileOverriderTestClass();

    const uploadedEvent = OfflineContentsUploadedDomainEventMother.any();

    const sut = new CreateFileOnOfflineFileUploaded(
      creator,
      toOverride,
      overrider
    );

    toOverride.mock.mockReturnValueOnce(Optional.empty());

    await sut.on(uploadedEvent);

    expect(creator.mock).toBeCalledWith(
      uploadedEvent.path,
      uploadedEvent.aggregateId,
      uploadedEvent.size
    );
  });

  it('does not create a new file an overridden file is provided', async () => {
    const creator = new FileCreatorTestClass();
    const toOverride = new FileToOverrideProviderTestClass();
    const overrider = new FileOverriderTestClass();

    const uploadedEvent = OfflineContentsUploadedDomainEventMother.any();

    const sut = new CreateFileOnOfflineFileUploaded(
      creator,
      toOverride,
      overrider
    );

    toOverride.mock.mockReturnValueOnce(Optional.of(FileMother.any()));

    await sut.on(uploadedEvent);

    expect(creator.mock).not.toBeCalled();
  });

  it('overrides the file with the data provided', async () => {
    const creator = new FileCreatorTestClass();
    const toOverride = new FileToOverrideProviderTestClass();
    const overrider = new FileOverriderTestClass();

    const uploadedEvent = OfflineContentsUploadedDomainEventMother.any();

    const sut = new CreateFileOnOfflineFileUploaded(
      creator,
      toOverride,
      overrider
    );

    toOverride.mock.mockReturnValueOnce(Optional.of(FileMother.any()));

    await sut.on(uploadedEvent);

    expect(overrider.mock).toBeCalledWith(
      uploadedEvent.path,
      uploadedEvent.aggregateId,
      uploadedEvent.size
    );
  });
});
