import path from 'path';
import { IpcRendererSyncEngineMock } from '../../../shared/test/__mock__/IpcRendererSyncEngineMock';
import { FolderCreator } from '../../application/FolderCreator';
import { FolderFinder } from '../../application/FolderFinder';
import { FolderPathCreator } from '../../application/FolderPathCreator';
import { FolderRepositoryMock } from '../__mocks__/FolderRepositoryMock';
import { FolderPath } from '../../domain/FolderPath';
import { FolderMother } from '../domain/FolderMother';

describe('Folder Creator', () => {
  let SUT: FolderCreator;

  let folderPathCreator: FolderPathCreator;
  let repository: FolderRepositoryMock;
  let folderFinder: FolderFinder;
  let syncEngineIpc: IpcRendererSyncEngineMock;

  const BASE_FOLDER_ID = 'D:\\Users\\HalfBloodPrince\\InternxtDrive';

  beforeEach(() => {
    folderPathCreator = new FolderPathCreator(BASE_FOLDER_ID);
    repository = new FolderRepositoryMock();
    folderFinder = new FolderFinder(repository);
    syncEngineIpc = new IpcRendererSyncEngineMock();

    SUT = new FolderCreator(
      folderPathCreator,
      repository,
      folderFinder,
      syncEngineIpc
    );
  });

  it('creates on a folder on the root folder', async () => {
    const folderPath = path.join(BASE_FOLDER_ID, 'lily');
    const expectedPath = new FolderPath('\\lily');

    const folder = FolderMother.root();

    const spy = jest.spyOn(folderFinder, 'run').mockReturnValueOnce(folder);

    await SUT.run(folderPath);

    expect(spy).toBeCalledWith('/');
    expect(repository.mockCreate).toBeCalledWith(expectedPath, folder.id);
  });

  describe('Synchronization messages', () => {
    it('sends the message FOLDER_CREATING', async () => {
      const folderPath = path.join(BASE_FOLDER_ID, 'lily');

      const folder = FolderMother.root();

      jest.spyOn(folderFinder, 'run').mockReturnValueOnce(folder);

      await SUT.run(folderPath);

      expect(syncEngineIpc.sendMock).toBeCalledWith('FOLDER_CREATING', {
        name: 'lily',
      });
      expect(syncEngineIpc.sendMock).toHaveBeenCalledBefore(
        repository.mockCreate
      );
    });

    it('sends the message FOLDER_CREATED', async () => {
      const folderPath = path.join(BASE_FOLDER_ID, 'lily');

      const folder = FolderMother.root();

      jest.spyOn(folderFinder, 'run').mockReturnValueOnce(folder);

      await SUT.run(folderPath);

      expect(syncEngineIpc.sendMock).toBeCalledWith('FOLDER_CREATED', {
        name: 'lily',
      });
    });
  });
});
