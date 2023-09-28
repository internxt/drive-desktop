import { FolderCreator } from '../../modules/folders/application/FolderCreator';
import { FolderDeleter } from '../../modules/folders/application/FolderDeleter';
import { FolderFinder } from '../../modules/folders/application/FolderFinder';
import { FolderPathCreator } from '../../modules/folders/application/FolderPathCreator';
import { FolderPathUpdater } from '../../modules/folders/application/FolderPathUpdater';
import { FolderSearcher } from '../../modules/folders/application/FolderSearcher';
import { ParentFoldersExistForDeletion } from '../../modules/folders/application/ParentFoldersExistForDeletion';
import { FolderPlaceholderCreator } from '../../modules/folders/infrastructure/FolderPlaceholderCreator';

export interface FoldersContainer {
  folderCreator: FolderCreator;
  folderFinder: FolderFinder;
  folderPathFromAbsolutePathCreator: FolderPathCreator;
  folderSearcher: FolderSearcher;
  folderDeleter: FolderDeleter;
  parentFoldersExistForDeletion: ParentFoldersExistForDeletion;
  folderPlaceholderCreator: FolderPlaceholderCreator;
  folderPathUpdater: FolderPathUpdater;
}
