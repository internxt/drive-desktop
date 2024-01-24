import { FolderRenamer } from '../../../../../src/context/virtual-drive/folders/application/FolderRenamer';
import { SynchronizeOfflineModifications } from '../../../../../src/context/virtual-drive/folders/application/SynchronizeOfflineModifications';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';
import { FolderUuid } from '../../../../../src/context/virtual-drive/folders/domain/FolderUuid';
import { FolderRenamedDomainEvent } from '../../../../../src/context/virtual-drive/folders/domain/events/FolderRenamedDomainEvent';
import { InMemoryOfflineFolderRepository } from '../../../../../src/context/virtual-drive/folders/infrastructure/InMemoryOfflineFolderRepository';
import { EventBusMock } from '../../shared/__mock__/EventBusMock';
import { EventRepositoryMock } from '../../shared/__mock__/EventRepositoryMock';
import { FolderRemoteFileSystemMock } from '../__mocks__/FolderRemoteFileSystemMock';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { SyncFolderMessengerMock } from '../__mocks__/SyncFolderMessengerMock';
import { FolderMother } from '../domain/FolderMother';
import { OfflineFolderMother } from '../domain/OfflineFolderMother';

describe('Synchronize Offline Modifications', () => {
  let offlineRepository: InMemoryOfflineFolderRepository;
  let repository: FolderRepositoryMock;
  let folderRemoteFileSystemMock: FolderRemoteFileSystemMock;
  let renamer: FolderRenamer;
  let eventRepositoryMock: EventRepositoryMock;
  let messenger: SyncFolderMessengerMock;

  let SUT: SynchronizeOfflineModifications;

  beforeEach(() => {
    offlineRepository = new InMemoryOfflineFolderRepository();
    folderRemoteFileSystemMock = new FolderRemoteFileSystemMock();
    repository = new FolderRepositoryMock();
    messenger = new SyncFolderMessengerMock();

    renamer = new FolderRenamer(
      repository,
      folderRemoteFileSystemMock,
      new EventBusMock(),
      messenger
    );
    eventRepositoryMock = new EventRepositoryMock();

    SUT = new SynchronizeOfflineModifications(
      offlineRepository,
      repository,
      renamer,
      eventRepositoryMock
    );
  });

  it('does nothing if there is no offline folder with the given uuid', async () => {
    jest
      .spyOn(offlineRepository, 'searchByPartial')
      .mockReturnValueOnce(undefined);

    await SUT.run(FolderUuid.random().value);

    expect(repository.searchByPartialMock).not.toBeCalled();
  });

  it('throws an error if there is no folder with the given uuid', async () => {
    jest
      .spyOn(offlineRepository, 'searchByPartial')
      .mockReturnValueOnce(OfflineFolderMother.random());

    repository.searchByPartialMock.mockReturnValueOnce(undefined);

    try {
      await SUT.run(FolderUuid.random().value);
      fail('Expected SUT.run to throw an error, but it did not.');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('does nothing if the name of the online folder is not the previous one on the event', async () => {
    const offlineFolder = OfflineFolderMother.random();

    offlineFolder.rename(
      FolderPath.fromParts(offlineFolder.dirname, offlineFolder.name + '!')
    );

    const folder = FolderMother.fromPartial({
      ...offlineFolder.attributes(),
      path: offlineFolder.dirname + offlineFolder.name.repeat(1),
    });

    const offlineRepositorySyp = jest
      .spyOn(offlineRepository, 'searchByPartial')
      .mockReturnValueOnce(offlineFolder);

    repository.searchByPartialMock.mockReturnValueOnce(folder);

    const renamerSpy = jest.spyOn(renamer, 'run');

    eventRepositoryMock.searchMock.mockResolvedValueOnce([]);

    await SUT.run(offlineFolder.uuid);

    expect(offlineRepositorySyp).toBeCalledWith({ uuid: offlineFolder.uuid });
    expect(eventRepositoryMock.searchMock).toBeCalledWith(offlineFolder.uuid);
    expect(renamerSpy).not.toBeCalled();
  });

  it('renames the online folder if the folder name is the previous one on the event', async () => {
    const offlineFolder = OfflineFolderMother.random();
    const folder = FolderMother.fromPartial(offlineFolder.attributes());

    offlineFolder.rename(
      FolderPath.fromParts(offlineFolder.dirname, offlineFolder.name + '!')
    );

    jest
      .spyOn(offlineRepository, 'searchByPartial')
      .mockReturnValueOnce(offlineFolder);

    const renamerSpy = jest.spyOn(renamer, 'run');

    repository.searchByPartialMock.mockReturnValueOnce(folder);

    const event = new FolderRenamedDomainEvent({
      aggregateId: offlineFolder.uuid,
      previousPath: folder.path,
      nextPath: offlineFolder.path,
    });

    eventRepositoryMock.searchMock.mockResolvedValueOnce([event]);

    await SUT.run(offlineFolder.uuid);

    expect(renamerSpy).toBeCalledWith(
      folder,
      new FolderPath(offlineFolder.path)
    );
  });

  it('makes all the name changes recoded on the events', async () => {
    const offlineFolder = OfflineFolderMother.random();
    const afterCreation = FolderMother.fromPartial(offlineFolder.attributes());

    offlineFolder.rename(
      FolderPath.fromParts(offlineFolder.dirname, offlineFolder.name + '!')
    );
    const afterFirstRename = FolderMother.fromPartial(
      offlineFolder.attributes()
    );

    const event = new FolderRenamedDomainEvent({
      aggregateId: offlineFolder.uuid,
      previousPath: afterCreation.path,
      nextPath: afterFirstRename.path,
    });

    eventRepositoryMock.searchMock.mockResolvedValueOnce([event]);

    jest
      .spyOn(offlineRepository, 'searchByPartial')
      .mockReturnValueOnce(offlineFolder);

    const renamerSpy = jest.spyOn(renamer, 'run');

    repository.searchByPartialMock
      .mockReturnValueOnce(afterCreation)
      .mockReturnValueOnce(afterFirstRename);

    const uuid = offlineFolder.uuid;

    await SUT.run(uuid);

    expect(renamerSpy).toBeCalledTimes(1);
  });
});
