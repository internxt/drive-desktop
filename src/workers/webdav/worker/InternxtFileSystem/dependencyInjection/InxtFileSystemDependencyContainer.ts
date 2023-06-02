import { WebdavFileClonner } from '../../../modules/files/application/WebdavFileClonner';
import { WebdavFileCreator } from '../../../modules/files/application/WebdavFileCreator';
import { WebdavFileDeleter } from '../../../modules/files/application/WebdavFileDeleter';
import { WebdavFileDownloader } from '../../../modules/files/application/WebdavFileDownloader';
import { WebdavFileExists } from '../../../modules/files/application/WebdavFileExists';
import { WebdavFileMimeTypeResolver } from '../../../modules/files/application/WebdavFileMimeTypeResolver';
import { WebdavFileMover } from '../../../modules/files/application/WebdavFileMover';
import { WebdavFolderCreator } from '../../../modules/folders/application/WebdavFolderCreator';
import { WebdavFolderDeleter } from '../../../modules/folders/application/WebdavFolderDeleter';
import { WebdavFolderFinder } from '../../../modules/folders/application/WebdavFolderFinder';
import { WebdavFolderMover } from '../../../modules/folders/application/WebdavFolderMover';
import { AllWebdavItemsNameLister } from '../../../modules/shared/application/AllWebdavItemsSearcher';
import { WebdavUnknownItemTypeSearcher } from '../../../modules/shared/application/WebdavUnknownItemTypeSearcher';
import { WebdavUnkownItemMetadataDealer } from '../../../modules/shared/application/WebdavUnkownItemMetadataDealer';

export type InternxtFileSystemDependencyContainer = {
  fileExists: WebdavFileExists;
  fileClonner: WebdavFileClonner;
  fileDeleter: WebdavFileDeleter;
  fileMover: WebdavFileMover;
  fileCreator: WebdavFileCreator;
  fileDonwloader: WebdavFileDownloader;
  fileMimeTypeResolver: WebdavFileMimeTypeResolver;

  folderCreator: WebdavFolderCreator;

  folderMover: WebdavFolderMover;
  folderFinder: WebdavFolderFinder;
  folderDeleter: WebdavFolderDeleter;

  itemMetadataDealer: WebdavUnkownItemMetadataDealer;
  itemSearcher: WebdavUnknownItemTypeSearcher;
  allItemsLister: AllWebdavItemsNameLister;
};
