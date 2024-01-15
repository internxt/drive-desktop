import { FolderFinder } from '../../../../context/virtual-drive/folders/application/FolderFinder';
import { FolderSearcher } from '../../../../context/virtual-drive/folders/application/FolderSearcher';
import { FoldersByParentPathLister } from '../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';

export interface FoldersContainer {
  folderFinder: FolderFinder;
  folderSearcher: FolderSearcher;
  foldersByParentPathSearcher: FoldersByParentPathLister;
}
