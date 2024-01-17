import { AllParentFoldersStatusIsExists } from '../../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderCreator } from '../../../../../context/virtual-drive/folders/application/FolderCreator';
import { FolderCreatorFromOfflineFolder } from '../../../../../context/virtual-drive/folders/application/FolderCreatorFromOfflineFolder';
import { FolderDeleter } from '../../../../../context/virtual-drive/folders/application/FolderDeleter';
import { FolderFinder } from '../../../../../context/virtual-drive/folders/application/FolderFinder';
import { FolderPathUpdater } from '../../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderRepositoryInitiator } from '../../../../../context/virtual-drive/folders/application/FolderRepositoryInitiator';
import { FolderSearcher } from '../../../../../context/virtual-drive/folders/application/FolderSearcher';
import { FoldersByParentPathLister } from '../../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';
import { SyncFolderMessenger } from '../../../../../context/virtual-drive/folders/domain/SyncFolderMessenger';

export interface FoldersContainer {
  folderFinder: FolderFinder;
  folderSearcher: FolderSearcher;
  foldersByParentPathLister: FoldersByParentPathLister;
  folderPathUpdater: FolderPathUpdater;
  allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  folderCreatorFromOfflineFolder: FolderCreatorFromOfflineFolder;
  folderCreator: FolderCreator;
  folderDeleter: FolderDeleter;
  folderRepositoryInitiator: FolderRepositoryInitiator;
  syncFolderMessenger: SyncFolderMessenger;
}
