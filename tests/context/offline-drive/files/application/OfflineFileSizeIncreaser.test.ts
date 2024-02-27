import { OfflineFileSizeIncreaser } from '../../../../../src/context/offline-drive/files/application/OfflineFileSizeIncreaser';
import { OfflineFile } from '../../../../../src/context/offline-drive/files/domain/OfflineFile';
import { OfflineFileRepositoryMock } from '../__mocks__/OfflineFileRepositoryMock';
import { OfflineFileIdMother } from '../domain/OfflineFileIdMother';
import { OfflineFileMother } from '../domain/OfflineFileMother';

describe('Offline File Size Increaser', () => {
  let SUT: OfflineFileSizeIncreaser;

  let repository: OfflineFileRepositoryMock;

  beforeEach(() => {
    repository = new OfflineFileRepositoryMock();

    SUT = new OfflineFileSizeIncreaser(repository);
  });

  it('increases the file size from a funded file', async () => {
    const id = OfflineFileIdMother.random();
    const file = OfflineFileMother.fromPartial({ id: id.value });

    const amount = 100;

    repository.searchByPartialMock.mockResolvedValueOnce(
      OfflineFile.from(file.attributes())
    );

    await SUT.run(id, amount);

    expect(repository.saveMock).toBeCalledWith(
      expect.objectContaining({ _size: file.size.increment(amount) })
    );
  });
});
