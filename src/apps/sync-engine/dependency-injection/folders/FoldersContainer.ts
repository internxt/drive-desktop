import { AllParentFoldersStatusIsExists } from '../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderCreatorFromOfflineFolder } from '../../../../context/virtual-drive/folders/application/FolderCreatorFromOfflineFolder';
import { FolderDeleter } from '../../../../context/virtual-drive/folders/application/FolderDeleter';
import { ParentFolderFinder } from '../../../../context/virtual-drive/folders/application/ParentFolderFinder';
import { FolderPathUpdater } from '../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderRepositoryInitializer } from '../../../../context/virtual-drive/folders/application/FolderRepositoryInitializer';
import { FoldersPlaceholderCreator } from '../../../../context/virtual-drive/folders/application/FoldersPlaceholderCreator';
import { OfflineFolderCreator } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderCreator';
import { OfflineFolderPathUpdater } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderPathUpdater';
import { RetrieveAllFolders } from '../../../../context/virtual-drive/folders/application/RetrieveAllFolders';
import { SynchronizeOfflineModifications } from '../../../../context/virtual-drive/folders/application/SynchronizeOfflineModifications';
import { SynchronizeOfflineModificationsOnFolderCreated } from '../../../../context/virtual-drive/folders/application/SynchronizeOfflineModificationsOnFolderCreated';
import { FolderPlaceholderUpdater } from '../../../../context/virtual-drive/folders/application/UpdatePlaceholderFolder';

export interface FoldersContainer {
  folderCreator: FolderCreatorFromOfflineFolder;
  parentFolderFinder: ParentFolderFinder;
  folderDeleter: FolderDeleter;
  allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  folderPathUpdater: FolderPathUpdater;
  synchronizeOfflineModificationsOnFolderCreated: SynchronizeOfflineModificationsOnFolderCreated;
  offline: {
    folderCreator: OfflineFolderCreator;
    folderPathUpdater: OfflineFolderPathUpdater;
    synchronizeOfflineModifications: SynchronizeOfflineModifications;
  };
  retrieveAllFolders: RetrieveAllFolders;
  folderRepositoryInitiator: FolderRepositoryInitializer;
  folderPlaceholderUpdater: FolderPlaceholderUpdater;
  foldersPlaceholderCreator: FoldersPlaceholderCreator;
}
