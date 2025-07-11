import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';
import { HttpRemoteFolderSystem } from '../../../../context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { InMemoryFolderRepository } from '../../../../context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { SharedContainer } from '../shared/SharedContainer';
import { FoldersContainer } from './FoldersContainer';
import { FolderPlaceholderDeleter } from './../../../../context/virtual-drive/folders/application/FolderPlaceholderDeleter';
import { NodeWinLocalFolderSystem } from '@/context/virtual-drive/folders/infrastructure/NodeWinLocalFolderSystem';
import { getConfig } from '../../config';
import { FolderPlaceholderUpdater } from '@/context/virtual-drive/folders/application/update/UpdatePlaceholderFolder';

export function buildFoldersContainer(shredContainer: SharedContainer): FoldersContainer {
  const { virtualDrive } = DependencyInjectionVirtualDrive;

  const repository = new InMemoryFolderRepository();

  const localFolderSystem = new NodeWinLocalFolderSystem(virtualDrive);
  const remoteFolderSystem = new HttpRemoteFolderSystem(getConfig().workspaceId ?? null);

  const folderCreator = new FolderCreator(repository, remoteFolderSystem, virtualDrive);

  const folderPlaceholderUpdater = new FolderPlaceholderUpdater(
    repository,
    localFolderSystem,
    shredContainer.relativePathToAbsoluteConverter,
    virtualDrive,
  );

  const folderPlaceholderDeleter = new FolderPlaceholderDeleter(virtualDrive);

  return {
    folderCreator,
    folderPlaceholderDeleter,
    folderRepository: repository,
    folderPlaceholderUpdater,
  };
}
