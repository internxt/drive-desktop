import { OfflineFileCreator } from '../../../../../src/context/offline-drive/files/application/OfflineFileCreator';
import { FileSize } from '../../../../../src/context/virtual-drive/files/domain/FileSize';
import { FilePathMother } from '../../../virtual-drive/files/domain/FilePathMother';
import { EventBusMock } from '../../../virtual-drive/shared/__mock__/EventBusMock';
import { OfflineFileRepositoryMock } from '../__mocks__/OfflineFileRepositoryMock';

describe('Offline File Creator', () => {
  let offlineFileRepository: OfflineFileRepositoryMock;
  let eventBus: EventBusMock;

  let SUT: OfflineFileCreator;

  beforeEach(() => {
    offlineFileRepository = new OfflineFileRepositoryMock();
    eventBus = new EventBusMock();

    SUT = new OfflineFileCreator(offlineFileRepository, eventBus);
  });

  it('creates an file with the given path and size 0', async () => {
    const path = FilePathMother.random(5);

    await SUT.run(path.value);

    expect(offlineFileRepository.saveMock).toBeCalledWith(
      expect.objectContaining({ _path: path, _size: new FileSize(0) })
    );
  });

  it('publishes offline file created event', async () => {
    const path = FilePathMother.random(7);

    await SUT.run(path.value);

    expect(eventBus.publishMock).toBeCalled();
  });
});
