import { ParentFolderFinder } from '../../../../context/virtual-drive/folders/application/ParentFolderFinder';
import { FoldersByParentPathLister } from '../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';
import { SingleFolderMatchingFinder } from '../../../../context/virtual-drive/folders/application/SingleFolderMatchingFinder';

export interface FoldersContainer {
  parentFolderFinder: ParentFolderFinder;
  foldersByParentPathSearcher: FoldersByParentPathLister;
  singleFolderMatchingFinder: SingleFolderMatchingFinder;
}
