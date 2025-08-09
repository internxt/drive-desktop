import { SharedContainer } from '../shared/SharedContainer';
import { FoldersContainer } from './FoldersContainer';
import { FolderPlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-folder-placeholder';
import { virtualDrive } from '../common/virtualDrive';

export function buildFoldersContainer(shredContainer: SharedContainer): FoldersContainer {
  const folderPlaceholderUpdater = new FolderPlaceholderUpdater(virtualDrive, shredContainer.relativePathToAbsoluteConverter);

  return {
    folderPlaceholderUpdater,
  };
}
