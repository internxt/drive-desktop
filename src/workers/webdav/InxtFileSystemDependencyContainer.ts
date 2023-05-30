import { WebdavFileClonner } from './files/application/WebdavFileClonner';
import { WebdavFileDeleter } from './files/application/WebdavFileDeleter';
import { WebdavFolderFinder } from './folders/application/WebdavFolderFinder';

export type InxtFileSystemDependencyContainer = {
  fileClonner: WebdavFileClonner;
  fileDeleter: WebdavFileDeleter;

  folderFinder: WebdavFolderFinder;
};
