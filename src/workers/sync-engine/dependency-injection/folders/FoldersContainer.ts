import { FolderFinder } from '../../modules/folders/application/FolderFinder';
import { FolderCreator } from '../../modules/folders/application/FolderCreator';
import { FolderPathFromAbsolutePathCreator } from '../../modules/folders/application/FolderPathFromAbsolutePathCreator';

export interface FoldersContainer {
  folderCreator: FolderCreator;
  folderFinder: FolderFinder;
  folderPathFromAbsolutePathCreator: FolderPathFromAbsolutePathCreator;
}
