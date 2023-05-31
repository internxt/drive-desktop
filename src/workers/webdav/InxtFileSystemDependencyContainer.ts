import { WebdavFileClonner } from './files/application/WebdavFileClonner';
import { WebdavFileDeleter } from './files/application/WebdavFileDeleter';
import { WebdavFileExists } from './files/application/WebdavFileExists';
import { WebdavFileMover } from './files/application/WebdavFileMover';
import { WebdavFolderCreator } from './folders/application/WebdavFolderCreator';
import { WebdavFolderDeleter } from './folders/application/WebdavFolderDeleter';
import { WebdavFolderFinder } from './folders/application/WebdavFolderFinder';
import { WebdavFolderMover } from './folders/application/WebdavFolderMover';
import { AllWebdavItemsNameLister } from './shared/application/AllWebdavItemsSearcher';
import { WebdavUnknownItemTypeSearcher } from './shared/application/WebdavUnknownItemTypeSearcher';
import { TreeRepository } from './TreeRepository';

export type InxtFileSystemDependencyContainer = {
  fileExists: WebdavFileExists;
  fileClonner: WebdavFileClonner;
  fileDeleter: WebdavFileDeleter;
  fileMover: WebdavFileMover;

  folderCreator: WebdavFolderCreator;
  folderMover: WebdavFolderMover;
  folderFinder: WebdavFolderFinder;
  folderDeleter: WebdavFolderDeleter;

  itemSearcher: WebdavUnknownItemTypeSearcher;
  allItemsLister: AllWebdavItemsNameLister;

  reposiotry: TreeRepository;
};
