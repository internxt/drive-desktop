import { FolderCreator } from '../../modules/folders/application/FolderCreator';
import { FolderFinder } from '../../modules/folders/application/FolderFinder';
import { FolderPathFromAbsolutePathCreator } from '../../modules/folders/application/FolderPathFromAbsolutePathCreator';
import { FolderSearcher } from '../../modules/folders/application/FolderSearcher';
import { WebdavFolderDeleter } from '../../modules/folders/application/WebdavFolderDeleter';

export interface FoldersContainer {
  folderCreator: FolderCreator;
  folderFinder: FolderFinder;
  folderPathFromAbsolutePathCreator: FolderPathFromAbsolutePathCreator;
  folderSearcher: FolderSearcher;
  folderDeleter: WebdavFolderDeleter;
}
