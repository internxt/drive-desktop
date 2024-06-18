import { InvalidArgumentError } from '../../../../../src/context/shared/domain/errors/InvalidArgumentError';
import { FolderCreator } from '../../../../../src/context/virtual-drive/folders/application/create/FolderCreator';
import { ParentFolderFinder } from '../../../../../src/context/virtual-drive/folders/application/ParentFolderFinder';
import { FolderStatuses } from '../../../../../src/context/virtual-drive/folders/domain/FolderStatus';
import { FolderInPathAlreadyExistsError } from '../../../../../src/context/virtual-drive/folders/domain/errors/FolderInPathAlreadyExistsError';
import { FolderNotFoundError } from '../../../../../src/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { EventBusMock } from '../../shared/__mock__/EventBusMock';
import { FolderRemoteFileSystemMock } from '../__mocks__/FolderRemoteFileSystemMock';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderMother } from '../domain/FolderMother';
import { FolderPathMother } from '../domain/FolderPathMother';

const WITH_NO_UUID = false;

describe('Folder Creator', () => {
  let repository: FolderRepositoryMock;
  let remote: FolderRemoteFileSystemMock;
  let eventBus: EventBusMock;

  let SUT: FolderCreator;

  beforeEach(() => {
    repository = new FolderRepositoryMock();
    remote = new FolderRemoteFileSystemMock();
    eventBus = new EventBusMock();

    const parentFolderFinder = new ParentFolderFinder(repository);

    SUT = new FolderCreator(repository, parentFolderFinder, remote, eventBus);
  });

  it('throws an InvalidArgument error if the path is not a valid posix path', async () => {
    const nonPosixPath = 'C:\\Users\\Internxt';

    try {
      await SUT.run(nonPosixPath);
      fail('Expected InvalidArgumentError, but no error was thrown.');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidArgumentError);
    }
  });

  it('throws a FolderInPathAlreadyExists error if there is a folder on the desired path', async () => {
    const path = FolderPathMother.any().value;
    const folder = FolderMother.fromPartial({
      path,
      status: FolderStatuses.EXISTS,
    });

    repository.matchingPartialMock.mockReturnValueOnce([folder]);

    try {
      await SUT.run(path);
      fail('Expected FolderInPathAlreadyExistsError, but no error was thrown.');
    } catch (err) {
      expect(err).toBeInstanceOf(FolderInPathAlreadyExistsError);
    }
  });

  it('throws a FolderNotFounded error if the parent folder is not founded', async () => {
    const path = FolderPathMother.any().value;

    repository.matchingPartialMock
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    try {
      await SUT.run(path);
      fail('Expected FolderNotFoundError, but no error was thrown.');
    } catch (err) {
      expect(err).toBeInstanceOf(FolderNotFoundError);
    }
  });

  it('persists a folder in the remote fs when the parent folder is found and the path is available', async () => {
    const path = FolderPathMother.any();
    const parent = FolderMother.fromPartial({ path: path.dirname() });
    const createdFolder = FolderMother.fromPartial({
      path: path.value,
      parentId: parent.id,
    });

    remote.shouldPersists(createdFolder, WITH_NO_UUID);

    repository.matchingPartialMock
      .mockReturnValueOnce([])
      .mockReturnValueOnce([parent]);

    await SUT.run(path.value);
  });

  it('add the folder to the repository', async () => {
    const path = FolderPathMother.any();
    const parent = FolderMother.fromPartial({ path: path.dirname() });
    const createdFolder = FolderMother.fromPartial({
      path: path.value,
      parentId: parent.id,
    });

    remote.shouldPersists(createdFolder, WITH_NO_UUID);

    repository.matchingPartialMock
      .mockReturnValueOnce([])
      .mockReturnValueOnce([parent]);

    await SUT.run(path.value);

    expect(repository.addMock).toBeCalledWith(
      expect.objectContaining(createdFolder)
    );
  });

  it('publishes folder created event', async () => {
    const path = FolderPathMother.any();
    const parent = FolderMother.fromPartial({ path: path.dirname() });
    const createdFolder = FolderMother.fromPartial({
      path: path.value,
      parentId: parent.id,
    });

    remote.shouldPersists(createdFolder, WITH_NO_UUID);

    repository.matchingPartialMock
      .mockReturnValueOnce([])
      .mockReturnValueOnce([parent]);

    await SUT.run(path.value);

    expect(eventBus.publishMock).toBeCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ aggregateId: createdFolder.uuid }),
      ])
    );
  });
});
