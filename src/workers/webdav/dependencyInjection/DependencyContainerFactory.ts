import { Environment } from '@internxt/inxt-js';
import PhotosSubmodule from '@internxt/sdk/dist/photos/photos';
import { ipcRenderer } from 'electron';
import { getUser } from 'main/auth/service';
import configStore from 'main/config';
import { getClients } from '../../../shared/HttpClient/backgroud-process-clients';
import crypt from '../../utils/crypt';
import { WebdavFileClonner } from '../modules/files/application/WebdavFileClonner';
import { WebdavFileCreator } from '../modules/files/application/WebdavFileCreator';
import { WebdavFileDeleter } from '../modules/files/application/WebdavFileDeleter';
import { WebdavFileDownloader } from '../modules/files/application/WebdavFileDownloader';
import { WebdavFileMimeTypeResolver } from '../modules/files/application/WebdavFileMimeTypeResolver';
import { WebdavFileMover } from '../modules/files/application/WebdavFileMover';
import { HttpWebdavFileRepository } from '../modules/files/infrastructure/persistance/HttpWebdavFileRepository';
import { InMemoryTemporalFileMetadataCollection } from '../modules/files/infrastructure/persistance/InMemoryTemporalFileMetadataCollection';
import { EnvironmentRemoteFileContentsManagersFactory } from '../modules/files/infrastructure/content/EnvironmentRemoteFileContentsManagersFactory';
import { WebdavFolderCreator } from '../modules/folders/application/WebdavFolderCreator';
import { WebdavFolderDeleter } from '../modules/folders/application/WebdavFolderDeleter';
import { WebdavFolderFinder } from '../modules/folders/application/WebdavFolderFinder';
import { WebdavFolderMover } from '../modules/folders/application/WebdavFolderMover';
import { HttpFolderRepository } from '../modules/folders/infrastructure/HttpFolderRepository';
import { Traverser } from '../modules/items/application/Traverser';
import { AllWebdavItemsNameLister } from '../modules/shared/application/AllWebdavItemsSearcher';
import { WebdavUnknownItemTypeSearcher } from '../modules/shared/application/WebdavUnknownItemTypeSearcher';
import { WebdavUnkownItemMetadataDealer } from '../modules/shared/application/WebdavUnkownItemMetadataDealer';
import { NodeJsEventBus } from '../modules/shared/infrastructure/DuplexEventBus';
import { FreeSpacePerEnvironmentCalculator } from '../modules/userUsage/application/FreeSpacePerEnvironmentCalculator';
import { IncrementDriveUsageOnFileCreated } from '../modules/userUsage/application/IncrementDriveUsageOnFileCreated';
import { UsedSpaceCalculator } from '../modules/userUsage/application/UsedSpaceCalculator';
import { UserUsageDecrementer } from '../modules/userUsage/application/UserUsageDecrementer';
import { UserUsageIncrementer } from '../modules/userUsage/application/UserUsageIncrementer';
import { CachedHttpUserUsageRepository } from '../modules/userUsage/infrastrucutre/CachedHttpUserUsageRepository';
import { DependencyContainer } from './DependencyContainer';
import { ipc } from '../ipc';
import { WebdavFolderRenamer } from '../modules/folders/application/WebdavFolderRenamer';
import { WebdavFileRenamer } from '../modules/files/application/WebdavFileRenamer';
import { CachedRemoteFileContentsManagersFactory } from '../modules/files/infrastructure/content/CachedRemoteFileContentsManagersFactory';
import { FSContentsCacheRepository } from '../modules/files/infrastructure/content/FSContentsCacheRepository';

export class DependencyContainerFactory {
  private _container: DependencyContainer | undefined;

  static readonly subscriptors: Array<keyof DependencyContainer> = [
    'incrementDriveUsageOnFileCreated',
  ];

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

    const token = await ipcRenderer.invoke('get-new-token');

    const photosSubmodule = new PhotosSubmodule({
      baseUrl: process.env.PHOTOS_URL,
      accessToken: token,
    });

    const userUsageRepository = new CachedHttpUserUsageRepository(
      clients.drive,
      photosSubmodule
    );

    const environment = new Environment({
      bridgeUrl: process.env.BRIDGE_URL,
      bridgeUser: user.bridgeUser,
      bridgePass: user.userId,
      encryptionKey: mnemonic,
    });

    const traverser = new Traverser(crypt, user.root_folder_id);

    const fileRepository = new HttpWebdavFileRepository(
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

    const cachePath = await ipcRenderer.invoke('get-path', 'userData');

    const localFileConentsRepository = new FSContentsCacheRepository(cachePath);

    await localFileConentsRepository.initialize();

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

    const eventBus = new NodeJsEventBus();

    const fileRenamer = new WebdavFileRenamer(
      fileRepository,
      contentsManagerFactory,
      eventBus,
      ipc
    );

    const folderFinder = new WebdavFolderFinder(folderRepository);
    const folderRenamer = new WebdavFolderRenamer(folderRepository, ipc);

    const temporalFileCollection = new InMemoryTemporalFileMetadataCollection();

    const unknownItemSearcher = new WebdavUnknownItemTypeSearcher(
      fileRepository,
      folderRepository
    );

    const userUsageIncrementer = new UserUsageIncrementer(userUsageRepository);

    const container = {
      drive: clients.drive,
      newDrive: clients.newDrive,

      userUsageRepository,
      freeUsageCalculator: new FreeSpacePerEnvironmentCalculator(
        userUsageRepository
      ),
      usedSpaceCalculator: new UsedSpaceCalculator(userUsageRepository),

      userUsageDecrementer: new UserUsageDecrementer(userUsageRepository),
      userUsageIncrementer,
      incrementDriveUsageOnFileCreated: new IncrementDriveUsageOnFileCreated(
        userUsageIncrementer
      ),

      fileClonner: new WebdavFileClonner(
        fileRepository,
        folderFinder,
        contentsManagerFactory,
        eventBus,
        ipc
      ),
      fileDeleter: new WebdavFileDeleter(fileRepository, eventBus, ipc),
      fileMover: new WebdavFileMover(
        fileRepository,
        folderFinder,
        fileRenamer,
        eventBus,
        ipc
      ),
      fileCreator: new WebdavFileCreator(
        fileRepository,
        folderFinder,
        contentsManagerFactory,
        temporalFileCollection,
        eventBus,
        ipc
      ),
      fileDownloader: new WebdavFileDownloader(
        fileRepository,
        contentsManagerFactory,
        eventBus,
        ipc
      ),
      fileRenamer,
      fileMimeTypeResolver: new WebdavFileMimeTypeResolver(),

      folderFinder,
      folderRenamer,
      folderCreator: new WebdavFolderCreator(
        folderRepository,
        folderFinder,
        ipc
      ),
      folderMover: new WebdavFolderMover(
        folderRepository,
        folderFinder,
        folderRenamer
      ),
      folderDeleter: new WebdavFolderDeleter(folderRepository),

      itemMetadataDealer: new WebdavUnkownItemMetadataDealer(
        unknownItemSearcher,
        temporalFileCollection
      ),
      allItemsLister: new AllWebdavItemsNameLister(
        fileRepository,
        folderRepository,
        folderFinder
      ),
      itemSearcher: unknownItemSearcher,
      eventBus,
    };

    this._container = container;

    return container;
  }
}
