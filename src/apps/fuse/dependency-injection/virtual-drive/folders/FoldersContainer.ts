import { AllParentFoldersStatusIsExists } from '../../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderCreator } from '../../../../../context/virtual-drive/folders/application/FolderCreator';
import { FolderCreatorFromOfflineFolder } from '../../../../../context/virtual-drive/folders/application/FolderCreatorFromOfflineFolder';
import { FolderDeleter } from '../../../../../context/virtual-drive/folders/application/FolderDeleter';
import { FolderPathUpdater } from '../../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderRepositoryInitializer } from '../../../../../context/virtual-drive/folders/application/FolderRepositoryInitializer';
import { FoldersByParentPathLister } from '../../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';
import { ParentFolderFinder } from '../../../../../context/virtual-drive/folders/application/ParentFolderFinder';
import { SingleFolderMatchingFinder } from '../../../../../context/virtual-drive/folders/application/SingleFolderMatchingFinder';
import { SingleFolderMatchingSearcher } from '../../../../../context/virtual-drive/folders/application/SingleFolderMatchingSearcher';
import { SyncFolderMessenger } from '../../../../../context/virtual-drive/folders/domain/SyncFolderMessenger';

export interface FoldersContainer {
  parentFolderFinder: ParentFolderFinder;
  foldersByParentPathLister: FoldersByParentPathLister;
  folderPathUpdater: FolderPathUpdater;
  allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  folderCreatorFromOfflineFolder: FolderCreatorFromOfflineFolder;
  folderCreator: FolderCreator;
  folderDeleter: FolderDeleter;
  folderRepositoryInitiator: FolderRepositoryInitializer;
  syncFolderMessenger: SyncFolderMessenger;
  singleFolderMatchingFinder: SingleFolderMatchingFinder;
  singleFolderMatchingSearcher: SingleFolderMatchingSearcher;
}
