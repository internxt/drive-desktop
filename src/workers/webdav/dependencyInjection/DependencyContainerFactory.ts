import { getUser } from 'main/auth/service';
import configStore from 'main/config';
import { getClients } from '../../../shared/HttpClient/backgroud-process-clients';
import crypt from '../../utils/crypt';
import { ipc } from '../ipc';
import { FileCreator } from '../modules/files/application/FileCreator';
import { FileDeleter } from '../modules/files/application/FileDeleter';
import { FileFinderByContentsId } from '../modules/files/application/FileFinderByContentsId';
import { FilePathFromAbsolutePathCreator } from '../modules/files/application/FilePathFromAbsolutePathCreator';
import { FileSearcher } from '../modules/files/application/FileSearcher';
import { FilePathUpdater } from '../modules/files/application/FilePathUpdater';
import { HttpFileRepository } from '../modules/files/infrastructure/HttpFileRepository';
import { FolderSearcher } from '../modules/folders/application/FolderSearcher';
import { WebdavFolderDeleter } from '../modules/folders/application/WebdavFolderDeleter';
import { WebdavFolderFinder } from '../modules/folders/application/WebdavFolderFinder';
import { HttpFolderRepository } from '../modules/folders/infrastructure/HttpFolderRepository';
import { Traverser } from '../modules/items/application/Traverser';
import { NodeJsEventBus } from '../modules/shared/infrastructure/DuplexEventBus';
import { DependencyContainer } from './DependencyContainer';
import { buildContentsContainer } from './contents/builder';
import { buildItemsContainer } from './items/builder';

export class DependencyContainerFactory {
  private static _container: DependencyContainer | undefined;

  // static readonly subscriptors: Array<keyof DependencyContainer> = [
  //   'incrementDriveUsageOnFileCreated',
  // ];

  eventSubscriptors(
    key: keyof DependencyContainer
  ): DependencyContainer[keyof DependencyContainer] | undefined {
    if (!DependencyContainerFactory._container) return undefined;

    return DependencyContainerFactory._container[key];
  }

  public get containter() {
    return DependencyContainerFactory._container;
  }

  async build(): Promise<DependencyContainer> {
    if (DependencyContainerFactory._container !== undefined) {
      return DependencyContainerFactory._container;
    }
    const user = getUser();

    if (!user) {
      throw new Error('');
    }

    const clients = getClients();

    const localRootFolderPath = configStore.get('syncRoot');

    const traverser = new Traverser(crypt, user.root_folder_id);

    const fileRepository = new HttpFileRepository(
      crypt,
      clients.drive,
      clients.newDrive,
      traverser,
      user.bucket,
      ipc
    );

    const folderRepository = new HttpFolderRepository(
      clients.drive,
      clients.newDrive,
      traverser,
      ipc
    );

    await fileRepository.init();
    await folderRepository.init();

    const itemsContainer = buildItemsContainer();
    const contentsContaner = buildContentsContainer();

    const eventBus = new NodeJsEventBus();

    const folderFinder = new WebdavFolderFinder(folderRepository);

    const fileFinder = new FileFinderByContentsId(fileRepository);

    const filePathUpdater = new FilePathUpdater(
      fileRepository,
      fileFinder,
      folderFinder
    );

    const container = {
      drive: clients.drive,
      newDrive: clients.newDrive,

      fileDeleter: new FileDeleter(fileRepository, fileFinder),
      fileCreator: new FileCreator(fileRepository, folderFinder, eventBus),

      filePathUpdater,
      fileSearcher: new FileSearcher(fileRepository),
      filePathFromAbsolutePathCreator: new FilePathFromAbsolutePathCreator(
        localRootFolderPath
      ),

      folderSearcher: new FolderSearcher(folderRepository),
      folderFinder,

      folderDeleter: new WebdavFolderDeleter(folderRepository),

      ...itemsContainer,
      ...contentsContaner,
    };

    DependencyContainerFactory._container = container;

    return container;
  }
}
