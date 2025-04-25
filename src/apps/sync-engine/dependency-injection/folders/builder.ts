import { AllParentFoldersStatusIsExists } from '../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';
import { FolderDeleter } from '../../../../context/virtual-drive/folders/application/FolderDeleter';
import { FolderFinder } from '../../../../context/virtual-drive/folders/application/FolderFinder';
import { FolderMover } from '../../../../context/virtual-drive/folders/application/FolderMover';
import { FolderPathUpdater } from '../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderRenamer } from '../../../../context/virtual-drive/folders/application/FolderRenamer';
import { FoldersPlaceholderCreator } from '../../../../context/virtual-drive/folders/application/FoldersPlaceholderCreator';
import { OfflineFolderCreator } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderCreator';
import { FolderPlaceholderUpdater } from '../../../../context/virtual-drive/folders/application/UpdatePlaceholderFolder';
import { HttpRemoteFolderSystem } from '../../../../context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { InMemoryFolderRepository } from '../../../../context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { SharedContainer } from '../shared/SharedContainer';
import { FoldersContainer } from './FoldersContainer';
import { RetryFolderDeleter } from '../../../../context/virtual-drive/folders/application/RetryFolderDeleter';
import { FolderContainerDetector } from '../../../../context/virtual-drive/folders/application/FolderContainerDetector';
import { FolderPlaceholderConverter } from '../../../../context/virtual-drive/folders/application/FolderPlaceholderConverter';
import { FolderSyncStatusUpdater } from '../../../../context/virtual-drive/folders/application/FolderSyncStatusUpdater';
import { FolderPlaceholderDeleter } from './../../../../context/virtual-drive/folders/application/FolderPlaceholderDeleter';
import { NodeWinLocalFolderSystem } from '@/context/virtual-drive/folders/infrastructure/NodeWinLocalFolderSystem';
import { getConfig } from '../../config';

export function buildFoldersContainer(shredContainer: SharedContainer): FoldersContainer {
  const { virtualDrive } = DependencyInjectionVirtualDrive;

  const repository = new InMemoryFolderRepository();

  const localFolderSystem = new NodeWinLocalFolderSystem(virtualDrive, shredContainer.relativePathToAbsoluteConverter);
  const remoteFolderSystem = new HttpRemoteFolderSystem(getConfig().workspaceId ?? null);

  const folderPlaceholderConverter = new FolderPlaceholderConverter(localFolderSystem);

  const folderSyncStatusUpdater = new FolderSyncStatusUpdater(localFolderSystem);

  const folderFinder = new FolderFinder(repository);

  const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(repository);

  const folderDeleter = new FolderDeleter(repository, remoteFolderSystem, localFolderSystem, allParentFoldersStatusIsExists);

  const retryFolderDeleter = new RetryFolderDeleter(folderDeleter);

  const folderCreator = new FolderCreator(repository, remoteFolderSystem, folderPlaceholderConverter);

  const folderMover = new FolderMover(repository, remoteFolderSystem, folderFinder);
  const folderRenamer = new FolderRenamer(repository, remoteFolderSystem);

  const folderPathUpdater = new FolderPathUpdater(repository, folderMover, folderRenamer);

  const offlineFolderCreator = new OfflineFolderCreator(folderFinder, repository);

  const foldersPlaceholderCreator = new FoldersPlaceholderCreator(localFolderSystem);

  const folderPlaceholderUpdater = new FolderPlaceholderUpdater(
    repository,
    localFolderSystem,
    shredContainer.relativePathToAbsoluteConverter,
  );

  const folderPlaceholderDeleter = new FolderPlaceholderDeleter(localFolderSystem);

  const folderContainerDetector = new FolderContainerDetector(repository);

  return {
    folderCreator,
    folderFinder,
    folderDeleter,
    retryFolderDeleter,
    allParentFoldersStatusIsExists,
    folderPathUpdater,
    folderContainerDetector,
    offline: {
      folderCreator: offlineFolderCreator,
    },
    folderPlaceholderDeleter,
    folderRepository: repository,
    foldersPlaceholderCreator,
    folderPlaceholderUpdater,
    folderPlaceholderConverter,
    folderSyncStatusUpdater,
  };
}
