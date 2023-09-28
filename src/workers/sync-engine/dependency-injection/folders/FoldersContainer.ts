import { FolderCreator } from '../../modules/folders/application/FolderCreator';
import { FolderDeleter } from '../../modules/folders/application/FolderDeleter';
import { FolderFinder } from '../../modules/folders/application/FolderFinder';
import { FolderPathCreator } from '../../modules/folders/application/FolderPathCreator';
import { FolderPathUpdater } from '../../modules/folders/application/FolderPathUpdater';
import { FolderSearcher } from '../../modules/folders/application/FolderSearcher';
import { AllParentFoldersStatusIsExists } from '../../modules/folders/application/AllParentFoldersStatusIsExists';

export interface FoldersContainer {
  folderCreator: FolderCreator;
  folderFinder: FolderFinder;
  folderPathFromAbsolutePathCreator: FolderPathCreator;
  folderSearcher: FolderSearcher;
  folderDeleter: FolderDeleter;
  allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  folderPathUpdater: FolderPathUpdater;
}
