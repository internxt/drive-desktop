import { AllParentFoldersStatusIsExists } from '../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';
import { FolderDeleter } from '../../../../context/virtual-drive/folders/application/FolderDeleter';
import { FolderFinder } from '../../../../context/virtual-drive/folders/application/FolderFinder';
import { FolderMover } from '../../../../context/virtual-drive/folders/application/FolderMover';
import { FolderPathUpdater } from '../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderRenamer } from '../../../../context/virtual-drive/folders/application/FolderRenamer';
import { FolderRepositoryInitiator } from '../../../../context/virtual-drive/folders/application/FolderRepositoryInitiator';
import { FoldersPlaceholderCreator } from '../../../../context/virtual-drive/folders/application/FoldersPlaceholderCreator';
import { OfflineFolderCreator } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderCreator';
import { OfflineFolderMover } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderMover';
import { OfflineFolderPathUpdater } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderPathUpdater';
import { OfflineFolderRenamer } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderRenamer';
import { SynchronizeOfflineModifications } from '../../../../context/virtual-drive/folders/application/SynchronizeOfflineModifications';
import { SynchronizeOfflineModificationsOnFolderCreated } from '../../../../context/virtual-drive/folders/application/SynchronizeOfflineModificationsOnFolderCreated';
import { FolderPlaceholderUpdater } from '../../../../context/virtual-drive/folders/application/UpdatePlaceholderFolder';
import { HttpRemoteFolderSystem } from '../../../../context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { InMemoryFolderRepository } from '../../../../context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { InMemoryOfflineFolderRepository } from '../../../../context/virtual-drive/folders/infrastructure/InMemoryOfflineFolderRepository';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { DependencyInjectionEventRepository } from '../common/eventRepository';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { SharedContainer } from '../shared/SharedContainer';
import { FoldersContainer } from './FoldersContainer';
import { RetryFolderDeleter } from '../../../../context/virtual-drive/folders/application/RetryFolderDeleter';
import { FolderContainerDetector } from '../../../../context/virtual-drive/folders/application/FolderContainerDetector';
import { FolderPlaceholderConverter } from '../../../../context/virtual-drive/folders/application/FolderPlaceholderConverter';
import { FolderSyncStatusUpdater } from '../../../../context/virtual-drive/folders/application/FolderSyncStatusUpdater';
import { FoldersFatherSyncStatusUpdater } from '../../../../context/virtual-drive/folders/application/FoldersFatherSyncStatusUpdater';
import { FolderPlaceholderDeleter } from './../../../../context/virtual-drive/folders/application/FolderPlaceholderDeleter';
import { NodeWinLocalFolderSystem } from '@/context/virtual-drive/folders/infrastructure/NodeWinLocalFolderSystem';
import { getConfig } from '../../config';

export async function buildFoldersContainer(shredContainer: SharedContainer): Promise<FoldersContainer> {
  const eventBus = DependencyInjectionEventBus.bus;
  const { virtualDrive } = DependencyInjectionVirtualDrive;
  const eventRepository = DependencyInjectionEventRepository.get();

  const repository = new InMemoryFolderRepository();

  const localFolderSystem = new NodeWinLocalFolderSystem(virtualDrive, shredContainer.relativePathToAbsoluteConverter);
  const remoteFolderSystem = new HttpRemoteFolderSystem(getConfig().workspaceId ?? null);

  const folderPlaceholderConverter = new FolderPlaceholderConverter(localFolderSystem);

  const folderSyncStatusUpdater = new FolderSyncStatusUpdater(localFolderSystem);

  const folderFinder = new FolderFinder(repository);

  const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(repository);

  const folderDeleter = new FolderDeleter(repository, remoteFolderSystem, localFolderSystem, allParentFoldersStatusIsExists);

  const retryFolderDeleter = new RetryFolderDeleter(folderDeleter);

  const folderCreator = new FolderCreator(repository, remoteFolderSystem, ipcRendererSyncEngine, eventBus, folderPlaceholderConverter);

  const folderMover = new FolderMover(repository, remoteFolderSystem, folderFinder);
  const folderRenamer = new FolderRenamer(repository, remoteFolderSystem, ipcRendererSyncEngine);

  const folderPathUpdater = new FolderPathUpdater(repository, folderMover, folderRenamer);

  const offlineRepository = new InMemoryOfflineFolderRepository();
  const offlineFolderCreator = new OfflineFolderCreator(folderFinder, offlineRepository, repository);

  const offlineFolderMover = new OfflineFolderMover(offlineRepository, folderFinder);
  const offlineFolderRenamer = new OfflineFolderRenamer(offlineRepository);
  const offlineFolderPathUpdater = new OfflineFolderPathUpdater(offlineRepository, offlineFolderMover, offlineFolderRenamer);
  const synchronizeOfflineModifications = new SynchronizeOfflineModifications(
    offlineRepository,
    repository,
    folderRenamer,
    eventRepository,
  );

  const synchronizeOfflineModificationsOnFolderCreated = new SynchronizeOfflineModificationsOnFolderCreated(
    synchronizeOfflineModifications,
  );

  const folderRepositoryInitiator = new FolderRepositoryInitiator(repository);

  const foldersPlaceholderCreator = new FoldersPlaceholderCreator(localFolderSystem);

  const folderPlaceholderUpdater = new FolderPlaceholderUpdater(
    repository,
    localFolderSystem,
    shredContainer.relativePathToAbsoluteConverter,
  );

  const folderPlaceholderDeleter = new FolderPlaceholderDeleter(
    shredContainer.relativePathToAbsoluteConverter,
    remoteFolderSystem,
    localFolderSystem,
  );

  const folderContainerDetector = new FolderContainerDetector(repository);
  const foldersFatherSyncStatusUpdater = new FoldersFatherSyncStatusUpdater(localFolderSystem, repository);

  return {
    folderCreator,
    folderFinder,
    folderDeleter,
    retryFolderDeleter,
    allParentFoldersStatusIsExists: allParentFoldersStatusIsExists,
    folderPathUpdater,
    folderContainerDetector,
    synchronizeOfflineModificationsOnFolderCreated,
    offline: {
      folderCreator: offlineFolderCreator,
      folderPathUpdater: offlineFolderPathUpdater,
      synchronizeOfflineModifications,
    },
    folderPlaceholderDeleter,
    folderRepositoryInitiator,
    foldersPlaceholderCreator,
    folderPlaceholderUpdater,
    folderPlaceholderConverter,
    folderSyncStatusUpdater,
    foldersFatherSyncStatusUpdater,
  };
}
