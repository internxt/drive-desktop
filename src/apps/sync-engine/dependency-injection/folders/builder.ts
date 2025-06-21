import { AllParentFoldersStatusIsExists } from '../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';
import { FolderDeleter } from '../../../../context/virtual-drive/folders/application/FolderDeleter';
import { FolderFinder } from '../../../../context/virtual-drive/folders/application/FolderFinder';
import { FolderMover } from '../../../../context/virtual-drive/folders/application/FolderMover';
import { FolderPathUpdater } from '../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderRenamer } from '../../../../context/virtual-drive/folders/application/FolderRenamer';
import { HttpRemoteFolderSystem } from '../../../../context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { InMemoryFolderRepository } from '../../../../context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { SharedContainer } from '../shared/SharedContainer';
import { FoldersContainer } from './FoldersContainer';
import { FolderContainerDetector } from '../../../../context/virtual-drive/folders/application/FolderContainerDetector';
import { FolderPlaceholderDeleter } from './../../../../context/virtual-drive/folders/application/FolderPlaceholderDeleter';
import { NodeWinLocalFolderSystem } from '@/context/virtual-drive/folders/infrastructure/NodeWinLocalFolderSystem';
import { getConfig } from '../../config';
import { FolderPlaceholderUpdater } from '@/context/virtual-drive/folders/application/update/UpdatePlaceholderFolder';

export function buildFoldersContainer(shredContainer: SharedContainer): FoldersContainer {
  const { virtualDrive } = DependencyInjectionVirtualDrive;

  const repository = new InMemoryFolderRepository();

  const localFolderSystem = new NodeWinLocalFolderSystem(virtualDrive);
  const remoteFolderSystem = new HttpRemoteFolderSystem(getConfig().workspaceId ?? null);

  const folderFinder = new FolderFinder(repository);

  const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(repository);

  const folderDeleter = new FolderDeleter(repository, remoteFolderSystem, localFolderSystem, allParentFoldersStatusIsExists);

  const folderCreator = new FolderCreator(repository, remoteFolderSystem, virtualDrive);

  const folderMover = new FolderMover(repository, remoteFolderSystem, folderFinder);
  const folderRenamer = new FolderRenamer(repository, remoteFolderSystem);

  const folderPathUpdater = new FolderPathUpdater(repository, folderMover, folderRenamer);

  const folderPlaceholderUpdater = new FolderPlaceholderUpdater(
    repository,
    localFolderSystem,
    shredContainer.relativePathToAbsoluteConverter,
    virtualDrive,
  );

  const folderPlaceholderDeleter = new FolderPlaceholderDeleter(virtualDrive);

  const folderContainerDetector = new FolderContainerDetector(repository);

  return {
    folderCreator,
    folderFinder,
    folderDeleter,
    allParentFoldersStatusIsExists,
    folderPathUpdater,
    folderContainerDetector,
    folderPlaceholderDeleter,
    folderRepository: repository,
    folderPlaceholderUpdater,
  };
}
