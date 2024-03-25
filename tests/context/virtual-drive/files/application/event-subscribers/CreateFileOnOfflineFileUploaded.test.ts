import { CreateFileOnOfflineFileUploaded } from '../../../../../../src/context/virtual-drive/files/application/event-subsribers/CreateFileOnOfflineFileUplodaded';
import { FileCreatorTestClass } from '../../__test-class__/FileCreatorTestClass';
import { FileOverriderTestClass } from '../../__test-class__/FileOverriderTestClass';
import { OfflineContentsUploadedDomainEventMother } from '../../domain/events/OfflineContentsUploadedDomainEventMother';

describe('Create File On Offline File Uploaded', () => {
  it('creates a new file when event replaces field is undefined', async () => {
    const creator = new FileCreatorTestClass();
    const overrider = new FileOverriderTestClass();

    const uploadedEvent =
      OfflineContentsUploadedDomainEventMother.doesNotReplace();

    const sut = new CreateFileOnOfflineFileUploaded(creator, overrider);

    await sut.on(uploadedEvent);

    expect(creator.mock).toBeCalledWith(
      uploadedEvent.path,
      uploadedEvent.aggregateId,
      uploadedEvent.size
    );
  });

  it('does not create a new file when the replaces files is defined', async () => {
    const creator = new FileCreatorTestClass();
    const overrider = new FileOverriderTestClass();

    const uploadedEvent =
      OfflineContentsUploadedDomainEventMother.replacesContents();

    const sut = new CreateFileOnOfflineFileUploaded(creator, overrider);

    await sut.on(uploadedEvent);

    expect(creator.mock).not.toBeCalled();
  });

  it('overrides file with contents specified on the event', async () => {
    const creator = new FileCreatorTestClass();
    const overrider = new FileOverriderTestClass();

    const uploadedEvent =
      OfflineContentsUploadedDomainEventMother.replacesContents();

    const sut = new CreateFileOnOfflineFileUploaded(creator, overrider);

    await sut.on(uploadedEvent);

    expect(overrider.mock).toBeCalledWith(
      uploadedEvent.replaces,
      uploadedEvent.aggregateId,
      uploadedEvent.size
    );
  });
});
