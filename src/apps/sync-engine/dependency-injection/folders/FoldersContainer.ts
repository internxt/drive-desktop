import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';
import { FolderPlaceholderDeleter } from '../../../../context/virtual-drive/folders/application/FolderPlaceholderDeleter';
import { InMemoryFolderRepository } from '@/context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { FolderPlaceholderUpdater } from '@/context/virtual-drive/folders/application/update/UpdatePlaceholderFolder';

export interface FoldersContainer {
  folderCreator: FolderCreator;
  folderRepository: InMemoryFolderRepository;
  folderPlaceholderUpdater: FolderPlaceholderUpdater;
  folderPlaceholderDeleter: FolderPlaceholderDeleter;
}
