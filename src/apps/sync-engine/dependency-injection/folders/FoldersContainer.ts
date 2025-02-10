import { AllParentFoldersStatusIsExists } from '../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderContainerDetector } from '../../../../context/virtual-drive/folders/application/FolderContainerDetector';
import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';
import { FolderDeleter } from '../../../../context/virtual-drive/folders/application/FolderDeleter';
import { FolderFinder } from '../../../../context/virtual-drive/folders/application/FolderFinder';
import { FolderPathUpdater } from '../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderRepositoryInitiator } from '../../../../context/virtual-drive/folders/application/FolderRepositoryInitiator';
import { FoldersPlaceholderCreator } from '../../../../context/virtual-drive/folders/application/FoldersPlaceholderCreator';
import { OfflineFolderCreator } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderCreator';
import { OfflineFolderPathUpdater } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderPathUpdater';
import { RetryFolderDeleter } from '../../../../context/virtual-drive/folders/application/RetryFolderDeleter';
import { SynchronizeOfflineModifications } from '../../../../context/virtual-drive/folders/application/SynchronizeOfflineModifications';
import { SynchronizeOfflineModificationsOnFolderCreated } from '../../../../context/virtual-drive/folders/application/SynchronizeOfflineModificationsOnFolderCreated';
import { FolderPlaceholderUpdater } from '../../../../context/virtual-drive/folders/application/UpdatePlaceholderFolder';
import { FolderPlaceholderConverter } from '../../../../context/virtual-drive/folders/application/FolderPlaceholderConverter';
import { FolderSyncStatusUpdater } from '../../../../context/virtual-drive/folders/application/FolderSyncStatusUpdater';
import { FoldersFatherSyncStatusUpdater } from '../../../../context/virtual-drive/folders/application/FoldersFatherSyncStatusUpdater';
import { FolderPlaceholderDeleter } from '../../../../context/virtual-drive/folders/application/FolderPlaceholderDeleter';

export interface FoldersContainer {
  folderCreator: FolderCreator;
  folderFinder: FolderFinder;
  folderContainerDetector: FolderContainerDetector;
  folderDeleter: FolderDeleter;
  retryFolderDeleter: RetryFolderDeleter;
  allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  folderPathUpdater: FolderPathUpdater;
  synchronizeOfflineModificationsOnFolderCreated: SynchronizeOfflineModificationsOnFolderCreated;
  offline: {
    folderCreator: OfflineFolderCreator;
    folderPathUpdater: OfflineFolderPathUpdater;
    synchronizeOfflineModifications: SynchronizeOfflineModifications;
  };
  folderRepositoryInitiator: FolderRepositoryInitiator;
  folderPlaceholderUpdater: FolderPlaceholderUpdater;
  folderPlaceholderDeleter?: FolderPlaceholderDeleter;
  foldersPlaceholderCreator: FoldersPlaceholderCreator;
  folderPlaceholderConverter: FolderPlaceholderConverter;
  folderSyncStatusUpdater: FolderSyncStatusUpdater;
  foldersFatherSyncStatusUpdater: FoldersFatherSyncStatusUpdater;
}
