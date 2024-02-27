import { ParentFolderFinder } from '../../../../context/virtual-drive/folders/application/ParentFolderFinder';
import { FoldersByParentPathLister } from '../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';

export interface FoldersContainer {
  parentFolderFinder: ParentFolderFinder;
  foldersByParentPathSearcher: FoldersByParentPathLister;
}
