import { Axios } from 'axios';
import { WebdavFileClonner } from '../modules/files/application/WebdavFileClonner';
import { WebdavFileCreator } from '../modules/files/application/WebdavFileCreator';
import { WebdavFileDeleter } from '../modules/files/application/WebdavFileDeleter';
import { WebdavFileDownloader } from '../modules/files/application/WebdavFileDownloader';
import { WebdavFileMimeTypeResolver } from '../modules/files/application/WebdavFileMimeTypeResolver';
import { WebdavFileMover } from '../modules/files/application/WebdavFileMover';
import { WebdavFileRenamer } from '../modules/files/application/WebdavFileRenamer';
import { WebdavFolderCreator } from '../modules/folders/application/WebdavFolderCreator';
import { WebdavFolderDeleter } from '../modules/folders/application/WebdavFolderDeleter';
import { WebdavFolderFinder } from '../modules/folders/application/WebdavFolderFinder';
import { WebdavFolderMover } from '../modules/folders/application/WebdavFolderMover';
import { WebdavFolderRenamer } from '../modules/folders/application/WebdavFolderRenamer';
import { AllWebdavItemsNameLister } from '../modules/shared/application/AllWebdavItemsSearcher';
import { WebdavUnknownItemTypeSearcher } from '../modules/shared/application/WebdavUnknownItemTypeSearcher';
import { WebdavUnkownItemMetadataDealer } from '../modules/shared/application/WebdavUnkownItemMetadataDealer';
import { WebdavServerEventBus } from '../modules/shared/domain/WebdavServerEventBus';
import { FreeSpacePerEnvironmentCalculator } from '../modules/userUsage/application/FreeSpacePerEnvironmentCalculator';
import { IncrementDriveUsageOnFileCreated } from '../modules/userUsage/application/IncrementDriveUsageOnFileCreated';
import { UsedSpaceCalculator } from '../modules/userUsage/application/UsedSpaceCalculator';
import { UserUsageDecrementer } from '../modules/userUsage/application/UserUsageDecrementer';
import { UserUsageIncrementer } from '../modules/userUsage/application/UserUsageIncrementer';
import { WebdavUserUsageRepository } from '../modules/userUsage/domain/WebdavUserUsageRepository';

export interface DependencyContainer {
  drive: Axios;
  newDrive: Axios;

  userUsageRepository: WebdavUserUsageRepository;
  freeUsageCalculator: FreeSpacePerEnvironmentCalculator;
  usedSpaceCalculator: UsedSpaceCalculator;
  userUsageIncrementer: UserUsageIncrementer;
  userUsageDecrementer: UserUsageDecrementer;
  incrementDriveUsageOnFileCreated: IncrementDriveUsageOnFileCreated;

  fileClonner: WebdavFileClonner;
  fileDeleter: WebdavFileDeleter;
  fileMover: WebdavFileMover;
  fileCreator: WebdavFileCreator;
  fileDonwloader: WebdavFileDownloader;
  fileMimeTypeResolver: WebdavFileMimeTypeResolver;
  fileRenamer: WebdavFileRenamer;

  folderCreator: WebdavFolderCreator;

  folderMover: WebdavFolderMover;
  folderFinder: WebdavFolderFinder;
  folderDeleter: WebdavFolderDeleter;
  folderRenamer: WebdavFolderRenamer;

  itemMetadataDealer: WebdavUnkownItemMetadataDealer;
  itemSearcher: WebdavUnknownItemTypeSearcher;
  allItemsLister: AllWebdavItemsNameLister;

  eventBus: WebdavServerEventBus;
}
