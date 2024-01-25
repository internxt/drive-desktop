import { OfflineFileDeleter } from '../../../../../src/context/offline-drive/files/application/OfflineFileDeleter';
import { FilePathMother } from '../../../virtual-drive/files/domain/FilePathMother';
import { OfflineFileRepositoryMock } from '../__mocks__/OfflineFileRepositoryMock';
import { OfflineFileMother } from '../domain/OfflineFileMother';

describe('Offline File Deleter', () => {
  let repository: OfflineFileRepositoryMock;
  let SUT: OfflineFileDeleter;

  beforeEach(() => {
    repository = new OfflineFileRepositoryMock();
    SUT = new OfflineFileDeleter(repository);
  });

  it('deletes the file if funded', async () => {
    const path = FilePathMother.random().value;
    const offlineFile = OfflineFileMother.fromPartial({
      path,
    });

    repository.searchByPartialMock.mockResolvedValueOnce(offlineFile);

    await SUT.run(path);

    expect(repository.deleteMock).toBeCalled();
  });

  it('does nothing if does not found the file', async () => {
    const path = FilePathMother.random();

    repository.searchByPartialMock.mockResolvedValueOnce(undefined);
    await SUT.run(path.value);

    expect(repository.deleteMock).not.toBeCalled();
  });
});
