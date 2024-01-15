import { AllParentFoldersStatusIsExists } from '../../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderCreator } from '../../../../../context/virtual-drive/folders/application/FolderCreator';
import { FolderDeleter } from '../../../../../context/virtual-drive/folders/application/FolderDeleter';
import { FolderFinder } from '../../../../../context/virtual-drive/folders/application/FolderFinder';
import { FolderPathUpdater } from '../../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderSearcher } from '../../../../../context/virtual-drive/folders/application/FolderSearcher';
import { FoldersByParentPathLister } from '../../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';
import { OfflineFolderCreator } from '../../../../../context/virtual-drive/folders/application/Offline/OfflineFolderCreator';

export interface FoldersContainer {
  folderFinder: FolderFinder;
  folderSearcher: FolderSearcher;
  foldersByParentPathLister: FoldersByParentPathLister;
  folderPathUpdater: FolderPathUpdater;
  allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  folderCreator: FolderCreator;
  folderDeleter: FolderDeleter;
  offline: {
    offlineFolderCreator: OfflineFolderCreator;
  };
}
