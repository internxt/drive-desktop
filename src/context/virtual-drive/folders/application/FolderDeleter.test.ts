import { AllParentFoldersStatusIsExists } from './AllParentFoldersStatusIsExists';
import { FolderDeleter } from './FolderDeleter';
import { FolderAlreadyTrashed } from '../domain/errors/FolderAlreadyTrashed';
import { FolderLocalFileSystemMock } from '../__mocks__/FolderLocalFileSystemMock';
import { FolderRemoteFileSystemMock } from '../__mocks__/FolderRemoteFileSystemMock';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderMother } from '../domain/__test-helpers__/FolderMother';

describe('Folder deleter', () => {
  let repository: FolderRepositoryMock;
  let allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  let remote: FolderRemoteFileSystemMock;
  let local: FolderLocalFileSystemMock;
  let SUT: FolderDeleter;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(repository);
    remote = new FolderRemoteFileSystemMock();
    local = new FolderLocalFileSystemMock();

    SUT = new FolderDeleter(repository, remote, local, allParentFoldersStatusIsExists);
  });

  it('trashes an existing folder', async () => {
    const folder = FolderMother.exists();

    remote.shouldTrash(folder);

    repository.searchByUuidMock.mockResolvedValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockResolvedValueOnce(true);

    await SUT.run(folder.uuid);
    expect(repository.deleteMock).toBeCalledWith(folder.id);
  });

  it('throws an error when trashing a folder already trashed', async () => {
    const folder = FolderMother.trashed();

    repository.searchByUuidMock.mockResolvedValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockResolvedValueOnce(true);

    await SUT.run(folder.uuid).catch((err) => {
      expect(err).toBeDefined();
      expect(err).toBeInstanceOf(FolderAlreadyTrashed);
    });

    expect(repository.deleteMock).not.toBeCalled();
  });

  it('does not delete the folder if a higher folder is already trashed ', async () => {
    const folder = FolderMother.exists();

    repository.searchByUuidMock.mockResolvedValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockResolvedValueOnce(false);

    await SUT.run(folder.uuid).catch((err) => {
      expect(err).toBeDefined();
    });

    expect(repository.deleteMock).not.toBeCalled();
  });

  it('recreates the placeholder if the deletion fails', async () => {
    const folder = FolderMother.exists();

    repository.searchByUuidMock.mockResolvedValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockResolvedValueOnce(true);
    remote.shouldTrash(folder, new Error('Error during the deletion'));

    await SUT.run(folder.uuid);

    expect(local.createPlaceHolderMock).toBeCalledWith(folder);
  });
});
