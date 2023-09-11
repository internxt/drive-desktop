/* eslint-disable max-len */
import { FileSearcher } from '../modules/files/application/FileSearcher';
import { FileDeleter } from '../modules/files/application/FileDeleter';
import { WebdavFileRenamer } from '../modules/files/application/WebdavFileRenamer';
import { FolderSearcher } from '../modules/folders/application/FolderSearcher';
import { FilePathFromAbsolutePathCreator } from '../modules/files/application/FilePathFromAbsolutePathCreator';
import { ItemsContainer } from './items/ItemsContainer';
import { ContentsContainer } from './contents/ContentsContainer';
import { FileCreator } from '../modules/files/application/FileCreator';

export interface DependencyContainer extends ItemsContainer, ContentsContainer {
  fileDeleter: FileDeleter;
  fileCreator: FileCreator;
  fileRenamer: WebdavFileRenamer;
  fileSearcher: FileSearcher;
  filePathFromAbsolutePathCreator: FilePathFromAbsolutePathCreator;

  folderSearcher: FolderSearcher;
}
