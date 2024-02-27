import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderMoverMock } from '../__mocks__/FolderMoverMock';
import { FolderRenamerMock } from '../__mocks__/FolderRenamerMock';
import { FolderPathUpdater } from '../../../../../src/context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderMother } from '../domain/FolderMother';
import { FolderPathMother } from '../domain/FolderPathMother';
import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderNotFoundError } from '../../../../../src/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { ActionNotPermittedError } from '../../../../../src/context/virtual-drive/folders/domain/errors/ActionNotPermittedError';
import { FolderUuid } from '../../../../../src/context/virtual-drive/folders/domain/FolderUuid';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';
import { PathHasNotChangedError } from '../../../../../src/context/virtual-drive/folders/domain/errors/PathHasNotChangedError';

describe('Folder Path Updater', () => {
  let repository: FolderRepositoryMock;
  let mover: FolderMoverMock;
  let renamer: FolderRenamerMock;

  let folderPathUpdater: FolderPathUpdater;

  beforeEach(() => {
    repository = new FolderRepositoryMock();

    mover = new FolderMoverMock();

    renamer = new FolderRenamerMock();

    folderPathUpdater = new FolderPathUpdater(repository, mover, renamer);
  });

  const provideInputs = (): { uuid: Folder['uuid']; destination: string } => {
    const folder = FolderMother.any();
    const destination = FolderPathMother.onFolder(folder.dirname).value;

    return {
      uuid: folder.uuid,
      destination,
    };
  };

  it('throws a Folder Not Found Error if not folder is founded', async () => {
    const { uuid, destination } = provideInputs();
    repository.matchingPartialMock.mockReturnValueOnce([]);

    try {
      await folderPathUpdater.run(uuid, destination);
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(FolderNotFoundError);
    }
  });

  it('throws an Action Not Permitted Error if the path has changed parent folder and name', async () => {
    const folder = FolderMother.any();
    const destination = FolderPathMother.any();

    repository.matchingPartialMock.mockReturnValueOnce([folder]);

    try {
      await folderPathUpdater.run(folder.uuid, destination.value);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ActionNotPermittedError);
    }
  });

  it('calls folder renamer when only the name changes', async () => {
    const folder = FolderMother.any();
    const folderPathWithNewName = FolderPathMother.onFolder(folder.dirname);

    repository.matchingPartialMock.mockReturnValueOnce([folder]);

    await folderPathUpdater.run(folder.uuid, folderPathWithNewName.value);

    expect(renamer.mock).toBeCalledTimes(1);
    expect(renamer.mock).toBeCalledWith(
      expect.objectContaining({ _uuid: new FolderUuid(folder.uuid) }),
      folderPathWithNewName
    );
  });

  it('calls folder mover when only the parent name changes', async () => {
    const folder = FolderMother.any();
    const desiredPath = FolderPathMother.withDifferentParent(
      new FolderPath(folder.path),
      folder.name + '(1)'
    );

    repository.matchingPartialMock.mockReturnValueOnce([folder]);

    await folderPathUpdater.run(folder.uuid, desiredPath.value);

    expect(mover.mock).toBeCalledTimes(1);
    expect(mover.mock).toBeCalledWith(
      expect.objectContaining({ _uuid: new FolderUuid(folder.uuid) }),
      desiredPath
    );
  });

  it('throws a Path Has Not Changed Error if the path desired path is the same as the current', async () => {
    const folder = FolderMother.any();

    repository.matchingPartialMock.mockReturnValueOnce([folder]);

    try {
      await folderPathUpdater.run(folder.uuid, folder.path);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(PathHasNotChangedError);
    }
  });
});
