import { FolderPlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-folder-placeholder';
import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';

export interface FoldersContainer {
  folderCreator: FolderCreator;
  folderPlaceholderUpdater: FolderPlaceholderUpdater;
}
