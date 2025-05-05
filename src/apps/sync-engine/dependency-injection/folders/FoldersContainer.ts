import { AllParentFoldersStatusIsExists } from '../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderContainerDetector } from '../../../../context/virtual-drive/folders/application/FolderContainerDetector';
import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';
import { FolderDeleter } from '../../../../context/virtual-drive/folders/application/FolderDeleter';
import { FolderFinder } from '../../../../context/virtual-drive/folders/application/FolderFinder';
import { FolderPathUpdater } from '../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { OfflineFolderCreator } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderCreator';
import { RetryFolderDeleter } from '../../../../context/virtual-drive/folders/application/RetryFolderDeleter';
import { FolderPlaceholderConverter } from '../../../../context/virtual-drive/folders/application/FolderPlaceholderConverter';
import { FolderPlaceholderDeleter } from '../../../../context/virtual-drive/folders/application/FolderPlaceholderDeleter';
import { InMemoryFolderRepository } from '@/context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { FolderPlaceholderUpdater } from '@/context/virtual-drive/folders/application/update/UpdatePlaceholderFolder';

export interface FoldersContainer {
  folderCreator: FolderCreator;
  folderFinder: FolderFinder;
  folderContainerDetector: FolderContainerDetector;
  folderDeleter: FolderDeleter;
  retryFolderDeleter: RetryFolderDeleter;
  allParentFoldersStatusIsExists: AllParentFoldersStatusIsExists;
  folderPathUpdater: FolderPathUpdater;
  offline: {
    folderCreator: OfflineFolderCreator;
  };
  folderRepository: InMemoryFolderRepository;
  folderPlaceholderUpdater: FolderPlaceholderUpdater;
  folderPlaceholderDeleter: FolderPlaceholderDeleter;
  folderPlaceholderConverter: FolderPlaceholderConverter;
}
