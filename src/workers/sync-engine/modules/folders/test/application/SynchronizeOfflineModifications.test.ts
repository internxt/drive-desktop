import { IpcRendererSyncEngineMock } from '../../../shared/test/__mock__/IpcRendererSyncEngineMock';
import { FolderRenamer } from '../../application/FolderRenamer';
import { SynchronizeOfflineModifications } from '../../application/SynchronizeOfflineModifications';
import { InMemoryOfflineFolderRepository } from '../../infrastructure/InMemoryOfflineFolderRepository';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderUuid } from '../../domain/FolderUuid';
import { OfflineFolderMother } from '../domain/OfflineFolderMother';
import { FolderMother } from '../domain/FolderMother';

describe('Synchronize Offline Modifications', () => {
  let offlineRepository: InMemoryOfflineFolderRepository;
  let repository: FolderRepositoryMock;
  let renamer: FolderRenamer;

  let SUT: SynchronizeOfflineModifications;

  beforeEach(() => {
    offlineRepository = new InMemoryOfflineFolderRepository();
    repository = new FolderRepositoryMock();
    renamer = new FolderRenamer(repository, new IpcRendererSyncEngineMock());

    SUT = new SynchronizeOfflineModifications(
      offlineRepository,
      repository,
      renamer
    );
  });

  it('does nothing if there is no offline folder with the given uuid', async () => {
    jest.spyOn(offlineRepository, 'getByUuid').mockReturnValueOnce(undefined);

    await SUT.run(FolderUuid.random().value);

    expect(repository.mockSearchByPartial).not.toBeCalled();
  });

  it('throws an error if there is no folder with the given uuid', async () => {
    jest
      .spyOn(offlineRepository, 'getByUuid')
      .mockReturnValueOnce(OfflineFolderMother.random());

    repository.mockSearchByPartial.mockReturnValueOnce(undefined);

    try {
      await SUT.run(FolderUuid.random().value);
      fail('Expected SUT.run to throw an error, but it did not.');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('does nothing if the name of the online and offline folder is the same', async () => {
    const offlineFolder = OfflineFolderMother.random();
    const folder = FolderMother.fromPartial(offlineFolder.attributes());

    const offlineRepositorySyp = jest
      .spyOn(offlineRepository, 'getByUuid')
      .mockReturnValueOnce(offlineFolder);

    const renamerSpy = jest.spyOn(renamer, 'run');

    repository.mockSearchByPartial.mockReturnValueOnce(folder);

    SUT.run(offlineFolder.uuid);

    expect(offlineRepositorySyp).toBeCalledWith(offlineFolder.uuid);
    expect(repository.mockSearchByPartial).toBeCalledWith({
      uuid: offlineFolder.uuid,
    });
    expect(renamerSpy).not.toBeCalled();
  });

  it('only renames the online folder if the modification data is older than the offline one', async () => {
    const offlineFolder = OfflineFolderMother.fromPartial({
      updatedAt: new Date('2023-10-01').toISOString(),
      path: '/new-name',
    });
    const folder = FolderMother.fromPartial({
      ...offlineFolder.attributes(),
      updatedAt: new Date('2000-10-01').toISOString(),
      path: '/old-name',
    });

    jest
      .spyOn(offlineRepository, 'getByUuid')
      .mockReturnValueOnce(offlineFolder);

    const renamerSpy = jest.spyOn(renamer, 'run');

    repository.mockSearchByPartial.mockReturnValueOnce(folder);

    SUT.run(offlineFolder.uuid);

    expect(renamerSpy).toBeCalledWith(folder, offlineFolder.path);
  });
});
