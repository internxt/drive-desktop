import { FolderPlaceholderCreator } from '../../modules/folders/infrastructure/FolderPlaceholderCreator';
import { FolderCreator } from '../../modules/folders/application/FolderCreator';
import { FolderDeleter } from '../../modules/folders/application/FolderDeleter';
import { FolderFinder } from '../../modules/folders/application/FolderFinder';
import { FolderPathFromAbsolutePathCreator } from '../../modules/folders/application/FolderPathFromAbsolutePathCreator';
import { FolderSearcher } from '../../modules/folders/application/FolderSearcher';
import { ParentFoldersExistForDeletion } from '../../modules/folders/application/ParentFoldersExistForDeletion';

export interface FoldersContainer {
  folderCreator: FolderCreator;
  folderFinder: FolderFinder;
  folderPathFromAbsolutePathCreator: FolderPathFromAbsolutePathCreator;
  folderSearcher: FolderSearcher;
  folderDeleter: FolderDeleter;
  parentFoldersExistForDeletion: ParentFoldersExistForDeletion;
  folderPlaceholderCreator: FolderPlaceholderCreator;
}
