import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';
import { HttpRemoteFolderSystem } from '../../../../context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { SharedContainer } from '../shared/SharedContainer';
import { FoldersContainer } from './FoldersContainer';
import { getConfig } from '../../config';
import { FolderPlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-folder-placeholder';

export function buildFoldersContainer(shredContainer: SharedContainer): FoldersContainer {
  const { virtualDrive } = DependencyInjectionVirtualDrive;

  const remoteFolderSystem = new HttpRemoteFolderSystem(getConfig().workspaceId);

  const folderCreator = new FolderCreator(remoteFolderSystem, virtualDrive);

  const folderPlaceholderUpdater = new FolderPlaceholderUpdater(virtualDrive, shredContainer.relativePathToAbsoluteConverter);

  return {
    folderCreator,
    folderPlaceholderUpdater,
  };
}
