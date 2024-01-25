import { AllParentFoldersStatusIsExists } from '../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderByPartialSearcher } from '../../../../context/virtual-drive/folders/application/FolderByPartialSearcher';
import { FolderCreatorFromOfflineFolder } from '../../../../context/virtual-drive/folders/application/FolderCreatorFromOfflineFolder';
import { FolderDeleter } from '../../../../context/virtual-drive/folders/application/FolderDeleter';
import { FolderFinder } from '../../../../context/virtual-drive/folders/application/FolderFinder';
import { FolderPathUpdater } from '../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderRepositoryInitiator } from '../../../../context/virtual-drive/folders/application/FolderRepositoryInitiator';
import { FoldersPlaceholderCreator } from '../../../../context/virtual-drive/folders/application/FoldersPlaceholderCreator';
import { OfflineFolderCreator } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderCreator';
import { OfflineFolderPathUpdater } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderPathUpdater';
import { RetrieveAllFolders } from '../../../../context/virtual-drive/folders/application/RetrieveAllFolders';
import { SynchronizeOfflineModifications } from '../../../../context/virtual-drive/folders/application/SynchronizeOfflineModifications';
import { SynchronizeOfflineModificationsOnFolderCreated } from '../../../../context/virtual-drive/folders/application/SynchronizeOfflineModificationsOnFolderCreated';
import { FolderPlaceholderUpdater } from '../../../../context/virtual-drive/folders/application/UpdatePlaceholderFolder';

export interface FoldersContainer {
  folderCreator: FolderCreatorFromOfflineFolder;
  folderFinder: FolderFinder;
  folderDeleter: FolderDeleter;
  allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  folderPathUpdater: FolderPathUpdater;
  folderByPartialSearcher: FolderByPartialSearcher;
  synchronizeOfflineModificationsOnFolderCreated: SynchronizeOfflineModificationsOnFolderCreated;
  offline: {
    folderCreator: OfflineFolderCreator;
    folderPathUpdater: OfflineFolderPathUpdater;
    synchronizeOfflineModifications: SynchronizeOfflineModifications;
  };
  retrieveAllFolders: RetrieveAllFolders;
  folderRepositoryInitiator: FolderRepositoryInitiator;
  folderPlaceholderUpdater: FolderPlaceholderUpdater;
  foldersPlaceholderCreator: FoldersPlaceholderCreator;
}
