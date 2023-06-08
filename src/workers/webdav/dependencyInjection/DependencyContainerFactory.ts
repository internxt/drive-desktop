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
import { WebdavFileExists } from '../modules/files/application/WebdavFileExists';
import { WebdavFileMimeTypeResolver } from '../modules/files/application/WebdavFileMimeTypeResolver';
import { WebdavFileMover } from '../modules/files/application/WebdavFileMover';
import { HttpWebdavFileRepository } from '../modules/files/infrastructure/persistance/HttpWebdavFileRepository';
import { InMemoryTemporalFileMetadataCollection } from '../modules/files/infrastructure/persistance/InMemoryTemporalFileMetadataCollection';
import { EnvironmentFileContentRepository } from '../modules/files/infrastructure/storage/EnvironmentFileContentRepository';
import { WebdavFolderCreator } from '../modules/folders/application/WebdavFolderCreator';
import { WebdavFolderDeleter } from '../modules/folders/application/WebdavFolderDeleter';
import { WebdavFolderFinder } from '../modules/folders/application/WebdavFolderFinder';
import { WebdavFolderMover } from '../modules/folders/application/WebdavFolderMover';
import { HttpWebdavFolderRepository } from '../modules/folders/infrastructure/HttpWebdavFolderRepository';
import { Traverser } from '../modules/items/application/Traverser';
import { AllWebdavItemsNameLister } from '../modules/shared/application/AllWebdavItemsSearcher';
import { WebdavUnknownItemTypeSearcher } from '../modules/shared/application/WebdavUnknownItemTypeSearcher';
import { WebdavUnkownItemMetadataDealer } from '../modules/shared/application/WebdavUnkownItemMetadataDealer';
import { DuplexEventBus } from '../modules/shared/infrastructure/DuplexEventBus';
import { FreeSpacePerEnvironmentCalculator } from '../modules/userUsage/application/FreeSpacePerEnvironmentCalculator';
import { IncrementDriveUsageOnFileCreated } from '../modules/userUsage/application/IncrementDriveUsageOnFileCreated';
import { UsedSpaceCalculator } from '../modules/userUsage/application/UsedSpaceCalculator';
import { UserUsageDecrementer } from '../modules/userUsage/application/UserUsageDecrementer';
import { UserUsageIncrementer } from '../modules/userUsage/application/UserUsageIncrementer';
import { CachedHttpUserUsageRepository } from '../modules/userUsage/infrastrucutre/CachedHttpUserUsageRepository';
import { DependencyContainer } from './DependencyContainer';

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
      clients.drive,
      clients.newDrive,
      traverser,
      user.bucket
    );

    const folderRepository = new HttpWebdavFolderRepository(
      clients.drive,
      clients.newDrive,
      traverser
    );

    await fileRepository.init();
    await folderRepository.init();

    const fileContentRepository = new EnvironmentFileContentRepository(
      environment,
      user.bucket
    );

    const folderFinder = new WebdavFolderFinder(folderRepository);

    const temporalFileCollection = new InMemoryTemporalFileMetadataCollection();

    const unknownItemSearcher = new WebdavUnknownItemTypeSearcher(
      fileRepository,
      folderRepository
    );

    const userUsageIncrementer = new UserUsageIncrementer(userUsageRepository);

    const eventBus = new DuplexEventBus();

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

      fileExists: new WebdavFileExists(fileRepository),
      fileClonner: new WebdavFileClonner(
        fileRepository,
        folderFinder,
        fileContentRepository,
        eventBus
      ),
      fileDeleter: new WebdavFileDeleter(fileRepository, eventBus),
      fileMover: new WebdavFileMover(fileRepository, folderFinder),
      fileCreator: new WebdavFileCreator(
        fileRepository,
        folderFinder,
        fileContentRepository,
        temporalFileCollection,
        eventBus
      ),
      fileDonwloader: new WebdavFileDownloader(
        fileRepository,
        fileContentRepository,
        eventBus
      ),
      fileMimeTypeResolver: new WebdavFileMimeTypeResolver(),

      folderFinder,
      folderCreator: new WebdavFolderCreator(folderRepository, folderFinder),
      folderMover: new WebdavFolderMover(folderRepository, folderFinder),
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