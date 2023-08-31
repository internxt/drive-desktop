import { Environment } from '@internxt/inxt-js';
import { getUser } from 'main/auth/service';
import configStore from 'main/config';
import { getClients } from '../../../shared/HttpClient/backgroud-process-clients';
import crypt from '../../utils/crypt';
import { FileDeleter } from '../modules/files/application/FileDeleter';
import { HttpFileRepository } from '../modules/files/infrastructure/persistance/HttpFileRepository';
import { WebdavFolderDeleter } from '../modules/folders/application/WebdavFolderDeleter';
import { WebdavFolderFinder } from '../modules/folders/application/WebdavFolderFinder';
import { HttpFolderRepository } from '../modules/folders/infrastructure/HttpFolderRepository';
import { Traverser } from '../modules/items/application/Traverser';
import { DependencyContainer } from './DependencyContainer';
import { ipc } from '../ipc';
import { WebdavFileRenamer } from '../modules/files/application/WebdavFileRenamer';
import { EnvironmentRemoteFileContentsManagersFactory } from '../modules/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { FileSearcher } from '../modules/files/application/FileSearcher';
import { FolderSearcher } from '../modules/folders/application/FolderSearcher';
import { FilePathFromAbsolutePathCreator } from '../modules/files/application/FilePathFromAbsolutePathCreator';

export class DependencyContainerFactory {
  private _container: DependencyContainer | undefined;

  // static readonly subscriptors: Array<keyof DependencyContainer> = [
  //   'incrementDriveUsageOnFileCreated',
  // ];

  eventSubscriptors(
    key: keyof DependencyContainer
  ): DependencyContainer[keyof DependencyContainer] | undefined {
    if (!this._container) return undefined;

    return this._container[key];
  }

  public get containter() {
    return this._container;
  }

  async build(): Promise<DependencyContainer> {
    if (this._container !== undefined) {
      return this._container;
    }
    const user = getUser();

    if (!user) {
      throw new Error('');
    }

    const clients = getClients();

    const mnemonic = configStore.get('mnemonic');
    const localRootFolderPath = configStore.get('syncRoot');

    // const token = await ipcRenderer.invoke('get-new-token');
    // const token = obtainToken('newToken');

    // const photosSubmodule = new PhotosSubmodule({
    //   baseUrl: process.env.PHOTOS_URL,
    //   accessToken: token,
    // });

    // const userUsageRepository = new CachedHttpUserUsageRepository(
    //   clients.drive,
    //   photosSubmodule
    // );

    const environment = new Environment({
      bridgeUrl: process.env.BRIDGE_URL,
      bridgeUser: user.bridgeUser,
      bridgePass: user.userId,
      encryptionKey: mnemonic,
    });

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

    // const cachePath = await ipcRenderer.invoke('get-path', 'userData');

    // const localFileConentsRepository = new FSContentsCacheRepository(cachePath);

    // await localFileConentsRepository.initialize();

    // const cachedContentsManagerFactory =
    //   new CachedRemoteFileContentsManagersFactory(
    //     localFileConentsRepository,
    //     new EnvironmentRemoteFileContentsManagersFactory(
    //       environment,
    //       user.bucket
    //     )
    //   );
    const contentsManagerFactory =
      new EnvironmentRemoteFileContentsManagersFactory(
        environment,
        user.bucket
      );

    // const eventBus = new NodeJsEventBus();

    const folderFinder = new WebdavFolderFinder(folderRepository);

    const fileRenamer = new WebdavFileRenamer(
      fileRepository,
      contentsManagerFactory,
      folderFinder
    );
    // const folderRenamer = new WebdavFolderRenamer(folderRepository, ipc);

    // const temporalFileCollection = new InMemoryTemporalFileMetadataCollection();

    // const unknownItemSearcher = new WebdavUnknownItemTypeSearcher(
    //   fileRepository,
    //   folderRepository
    // );

    // const userUsageIncrementer = new UserUsageIncrementer(userUsageRepository);

    const container = {
      drive: clients.drive,
      newDrive: clients.newDrive,

      // userUsageRepository,
      // freeUsageCalculator: new FreeSpacePerEnvironmentCalculator(
      //   userUsageRepository
      // ),
      // usedSpaceCalculator: new UsedSpaceCalculator(userUsageRepository),

      // userUsageDecrementer: new UserUsageDecrementer(userUsageRepository),
      // userUsageIncrementer,
      // incrementDriveUsageOnFileCreated: new IncrementDriveUsageOnFileCreated(
      //   userUsageIncrementer
      // ),

      // fileClonner: new WebdavFileClonner(
      //   fileRepository,
      //   folderFinder,
      //   contentsManagerFactory,
      //   eventBus,
      //   ipc
      // ),
      fileDeleter: new FileDeleter(fileRepository),
      // fileMover: new WebdavFileMover(
      //   fileRepository,
      //   folderFinder,
      //   fileRenamer,
      //   eventBus,
      //   ipc
      // ),
      // fileCreator: new WebdavFileCreator(
      //   fileRepository,
      //   folderFinder,
      //   contentsManagerFactory,
      //   temporalFileCollection,
      //   eventBus,
      //   ipc
      // ),
      // fileDownloader: new WebdavFileDownloader(
      //   fileRepository,
      //   contentsManagerFactory,
      //   eventBus,
      //   ipc
      // ),
      fileRenamer,
      // fileMimeTypeResolver: new WebdavFileMimeTypeResolver(),
      fileSearcher: new FileSearcher(fileRepository),
      filePathFromAbsolutePathCreator: new FilePathFromAbsolutePathCreator(
        localRootFolderPath
      ),

      folderSearcher: new FolderSearcher(folderRepository),
      folderFinder,
      // folderRenamer,
      // folderCreator: new WebdavFolderCreator(
      //   folderRepository,
      //   folderFinder,
      //   ipc
      // ),
      // folderMover: new WebdavFolderMover(
      //   folderRepository,
      //   folderFinder,
      //   folderRenamer
      // ),
      folderDeleter: new WebdavFolderDeleter(folderRepository),

      // itemMetadataDealer: new WebdavUnkownItemMetadataDealer(
      //   unknownItemSearcher,
      //   temporalFileCollection
      // ),
      //   allItemsLister: new AllWebdavItemsNameLister(
      //     fileRepository,
      //     folderRepository,
      //     folderFinder
      //   ),
      //   itemSearcher: unknownItemSearcher,
      //   eventBus,
    };

    this._container = container;

    return container;
  }
}
