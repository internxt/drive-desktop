import { EventBusMock } from '../../../../../context/virtual-drive/shared/__mocks__/EventBusMock';
import { InvalidArgumentError } from '../../../../shared/domain/errors/InvalidArgumentError';
import { FolderCreator } from './FolderCreator';
import { ParentFolderFinder } from '../ParentFolderFinder';
import { FolderStatuses } from '../../domain/FolderStatus';
import { FolderInPathAlreadyExistsError } from '../../domain/errors/FolderInPathAlreadyExistsError';
import { FolderNotFoundError } from '../../domain/errors/FolderNotFoundError';
import { FolderRemoteFileSystemMock } from '../../__mocks__/FolderRemoteFileSystemMock';
import { FolderRepositoryMock } from '../../__mocks__/FolderRepositoryMock';
import { FolderPathMother } from '../../domain/__test-helpers__/FolderPathMother';
import { FolderMother } from '../../domain/__test-helpers__/FolderMother';

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

    await expect(SUT.run(nonPosixPath)).rejects.toThrow(InvalidArgumentError);
  });

  it('throws a FolderInPathAlreadyExists error if there is a folder on the desired path', async () => {
    const path = FolderPathMother.any().value;
    const folder = FolderMother.fromPartial({
      path,
      status: FolderStatuses.EXISTS,
    });

    repository.matchingPartialMock.mockReturnValueOnce([folder]);

    await expect(SUT.run(path)).rejects.toThrow(FolderInPathAlreadyExistsError);
  });

  it('throws a FolderNotFounded error if the parent folder is not founded', async () => {
    const path = FolderPathMother.any().value;

    repository.matchingPartialMock.mockReturnValueOnce([]).mockReturnValueOnce([]);

    await expect(SUT.run(path)).rejects.toThrow(FolderNotFoundError);
  });

  it('persists a folder in the remote fs when the parent folder is found and the path is available', async () => {
    const path = FolderPathMother.any();
    const parent = FolderMother.fromPartial({ path: path.dirname() });
    const createdFolder = FolderMother.fromPartial({
      path: path.value,
      parentId: parent.id,
      uuid: parent.uuid, // The mock expects the parent's UUID in this case
    });

    remote.shouldPersists(createdFolder, true); // Pass parent's UUID

    repository.matchingPartialMock
      .mockReturnValueOnce([])
      .mockReturnValueOnce([parent])
      .mockReturnValueOnce([parent]);

    await SUT.run(path.value);
  });

  it('add the folder to the repository', async () => {
    const path = FolderPathMother.any();
    const parent = FolderMother.fromPartial({ path: path.dirname() });
    const createdFolder = FolderMother.fromPartial({
      path: path.value,
      parentId: parent.id,
      uuid: parent.uuid,
    });

    remote.shouldPersists(createdFolder, true);

    repository.matchingPartialMock
      .mockReturnValueOnce([])
      .mockReturnValueOnce([parent])
      .mockReturnValueOnce([parent]);

    await SUT.run(path.value);

    expect(repository.addMock).toBeCalledWith(expect.objectContaining(createdFolder));
  });

  it('publishes folder created event', async () => {
    const path = FolderPathMother.any();
    const parent = FolderMother.fromPartial({ path: path.dirname() });
    const createdFolder = FolderMother.fromPartial({
      path: path.value,
      parentId: parent.id,
      uuid: parent.uuid,
    });

    remote.shouldPersists(createdFolder, true);

    repository.matchingPartialMock
      .mockReturnValueOnce([])
      .mockReturnValueOnce([parent])
      .mockReturnValueOnce([parent]);

    await SUT.run(path.value);

    expect(eventBus.publishMock).toBeCalledWith(
      expect.arrayContaining([expect.objectContaining({ aggregateId: createdFolder.uuid })]),
    );
  });
});
