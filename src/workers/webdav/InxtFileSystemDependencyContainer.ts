import { WebdavFileClonner } from './files/application/WebdavFileClonner';
import { WebdavFileCreator } from './files/application/WebdavFileCreator';
import { WebdavFileDeleter } from './files/application/WebdavFileDeleter';
import { WebdavFileDownloader } from './files/application/WebdavFileDownloader';
import { WebdavFileExists } from './files/application/WebdavFileExists';
import { WebdavFileMimeTypeResolver } from './files/application/WebdavFileMimeTypeResolver';
import { WebdavFileMover } from './files/application/WebdavFileMover';
import { WebdavFolderCreator } from './folders/application/WebdavFolderCreator';
import { WebdavFolderDeleter } from './folders/application/WebdavFolderDeleter';
import { WebdavFolderFinder } from './folders/application/WebdavFolderFinder';
import { WebdavFolderMover } from './folders/application/WebdavFolderMover';
import { AllWebdavItemsNameLister } from './shared/application/AllWebdavItemsSearcher';
import { WebdavUnknownItemTypeSearcher } from './shared/application/WebdavUnknownItemTypeSearcher';
import { WebdavUnkownItemMetadataDealer } from './shared/application/WebdavUnkownItemMetadataDealer';
import { TreeRepository } from './TreeRepository';

export type InxtFileSystemDependencyContainer = {
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

  reposiotry: TreeRepository;
};
