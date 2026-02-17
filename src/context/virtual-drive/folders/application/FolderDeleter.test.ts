import { AllParentFoldersStatusIsExists } from './AllParentFoldersStatusIsExists';
import { FolderDeleter } from './FolderDeleter';
import { FolderAlreadyTrashed } from '../domain/errors/FolderAlreadyTrashed';
import { FolderLocalFileSystemMock } from '../__mocks__/FolderLocalFileSystemMock';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderMother } from '../domain/__test-helpers__/FolderMother';
import * as addFolderToTrashModule from '../../../../infra/drive-server/services/folder/services/add-folder-to-trash';
import { call, partialSpyOn } from 'tests/vitest/utils.helper';

describe('Folder deleter', () => {
  let repository: FolderRepositoryMock;
  let allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  let local: FolderLocalFileSystemMock;
  let SUT: FolderDeleter;

  const addFolderToTrashMock = partialSpyOn(addFolderToTrashModule, 'addFolderToTrash');

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(repository);
    local = new FolderLocalFileSystemMock();

    SUT = new FolderDeleter(repository, local, allParentFoldersStatusIsExists);
  });

  it('trashes an existing folder', async () => {
    const folder = FolderMother.exists();

    addFolderToTrashMock.mockResolvedValue({ data: true });

    repository.searchByUuidMock.mockResolvedValueOnce(folder);
    vi.spyOn(allParentFoldersStatusIsExists, 'run').mockResolvedValueOnce(true);

    await SUT.run(folder.uuid);

    call(addFolderToTrashMock).toBe(folder.uuid);
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
    addFolderToTrashMock.mockResolvedValue({ error: new Error('Error during the deletion') } as any);

    await SUT.run(folder.uuid);

    expect(local.createPlaceHolderMock).toBeCalledWith(folder);
  });
});
