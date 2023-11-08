import { IpcRendererSyncEngineMock } from '../../../shared/test/__mock__/IpcRendererSyncEngineMock';
import { FolderRenamer } from '../../application/FolderRenamer';
import { SynchronizeOfflineModifications } from '../../application/SynchronizeOfflineModifications';
import { InMemoryOfflineFolderRepository } from '../../infrastructure/InMemoryOfflineFolderRepository';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderUuid } from '../../domain/FolderUuid';
import { OfflineFolderMother } from '../domain/OfflineFolderMother';
import { FolderMother } from '../domain/FolderMother';
import { FolderPath } from '../../domain/FolderPath';
import { FolderRemoteFileSystemMock } from '../__mocks__/FolderRemoteFileSystemMock';

describe('Synchronize Offline Modifications', () => {
  let offlineRepository: InMemoryOfflineFolderRepository;
  let repository: FolderRepositoryMock;
  let folderRemoteFileSystemMock: FolderRemoteFileSystemMock;
  let renamer: FolderRenamer;

  let SUT: SynchronizeOfflineModifications;

  beforeEach(() => {
    offlineRepository = new InMemoryOfflineFolderRepository();
    folderRemoteFileSystemMock = new FolderRemoteFileSystemMock();
    repository = new FolderRepositoryMock();
    renamer = new FolderRenamer(
      repository,
      folderRemoteFileSystemMock,
      new IpcRendererSyncEngineMock()
    );

    SUT = new SynchronizeOfflineModifications(
      offlineRepository,
      repository,
      renamer
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

    await SUT.run(offlineFolder.uuid);

    expect(offlineRepositorySyp).toBeCalledWith(offlineFolder.uuid);
    expect(repository.searchByPartialMock).toBeCalledWith({
      uuid: offlineFolder.uuid,
    });
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

    await SUT.run(offlineFolder.uuid);

    expect(renamerSpy).toBeCalledWith(folder, offlineFolder.path);
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
    offlineFolder.rename(
      FolderPath.fromParts(offlineFolder.dirname, offlineFolder.name + '!')
    );

    jest
      .spyOn(offlineRepository, 'searchByPartial')
      .mockReturnValueOnce(offlineFolder);

    const renamerSpy = jest.spyOn(renamer, 'run');

    repository.searchByPartialMock
      .mockReturnValueOnce(afterCreation)
      .mockReturnValueOnce(afterFirstRename);

    const uuid = offlineFolder.uuid;
    await SUT.run(uuid);

    expect(renamerSpy).toBeCalledTimes(2);
  });
});
