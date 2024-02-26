import { AllParentFoldersStatusIsExists } from '../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderByPartialSearcher } from '../../../../context/virtual-drive/folders/application/FolderByPartialSearcher';
import { FolderCreatorFromOfflineFolder } from '../../../../context/virtual-drive/folders/application/FolderCreatorFromOfflineFolder';
import { FolderDeleter } from '../../../../context/virtual-drive/folders/application/FolderDeleter';
import { FolderFinder } from '../../../../context/virtual-drive/folders/application/FolderFinder';
import { FolderMover } from '../../../../context/virtual-drive/folders/application/FolderMover';
import { FolderPathUpdater } from '../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderRenamer } from '../../../../context/virtual-drive/folders/application/FolderRenamer';
import { FolderRepositoryInitializer } from '../../../../context/virtual-drive/folders/application/FolderRepositoryInitializer';
import { FoldersPlaceholderCreator } from '../../../../context/virtual-drive/folders/application/FoldersPlaceholderCreator';
import { OfflineFolderCreator } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderCreator';
import { OfflineFolderMover } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderMover';
import { OfflineFolderPathUpdater } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderPathUpdater';
import { OfflineFolderRenamer } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderRenamer';
import { RetrieveAllFolders } from '../../../../context/virtual-drive/folders/application/RetrieveAllFolders';
import { SynchronizeOfflineModifications } from '../../../../context/virtual-drive/folders/application/SynchronizeOfflineModifications';
import { SynchronizeOfflineModificationsOnFolderCreated } from '../../../../context/virtual-drive/folders/application/SynchronizeOfflineModificationsOnFolderCreated';
import { FolderPlaceholderUpdater } from '../../../../context/virtual-drive/folders/application/UpdatePlaceholderFolder';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/folders/infrastructure/HttpRemoteFileSystem';
import { InMemoryFolderRepository } from '../../../../context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { InMemoryOfflineFolderRepository } from '../../../../context/virtual-drive/folders/infrastructure/InMemoryOfflineFolderRepository';
import { NodeWinLocalFileSystem } from '../../../../context/virtual-drive/folders/infrastructure/NodeWinLocalFileSystem';
import { BackgroundProcessSyncFolderMessenger } from '../../../../context/virtual-drive/folders/infrastructure/SyncMessengers/BackgroundProcessSyncFolderMessenger';
import { SyncEngineIPC } from '../../SyncEngineIpc';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { DependencyInjectionEventRepository } from '../common/eventRepository';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { SharedContainer } from '../shared/SharedContainer';
import { FoldersContainer } from './FoldersContainer';

export async function buildFoldersContainer(
  shredContainer: SharedContainer
): Promise<FoldersContainer> {
  const clients = DependencyInjectionHttpClientsProvider.get();
  const eventBus = DependencyInjectionEventBus.bus;
  const { virtualDrive } = DependencyInjectionVirtualDrive;
  const eventRepository = DependencyInjectionEventRepository.get();

  const repository = new InMemoryFolderRepository();

  const syncFolderMessenger = new BackgroundProcessSyncFolderMessenger(
    SyncEngineIPC
  );

  const localFileSystem = new NodeWinLocalFileSystem(virtualDrive);
  const remoteFileSystem = new HttpRemoteFileSystem(
    //  @ts-ignore
    clients.drive,
    clients.newDrive
  );

  const folderFinder = new FolderFinder(repository);

  const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(
    repository
  );

  const folderDeleter = new FolderDeleter(
    repository,
    remoteFileSystem,
    localFileSystem,
    allParentFoldersStatusIsExists
  );

  const folderCreator = new FolderCreatorFromOfflineFolder(
    repository,
    remoteFileSystem,
    eventBus,
    syncFolderMessenger
  );

  const folderMover = new FolderMover(
    repository,
    remoteFileSystem,
    folderFinder
  );
  const folderRenamer = new FolderRenamer(
    repository,
    remoteFileSystem,
    eventBus,
    syncFolderMessenger
  );

  const folderByPartialSearcher = new FolderByPartialSearcher(repository);

  const folderPathUpdater = new FolderPathUpdater(
    repository,
    folderMover,
    folderRenamer
  );

  const offlineRepository = new InMemoryOfflineFolderRepository();
  const offlineFolderCreator = new OfflineFolderCreator(
    folderFinder,
    offlineRepository,
    repository
  );

  const offlineFolderMover = new OfflineFolderMover(
    offlineRepository,
    folderFinder
  );
  const offlineFolderRenamer = new OfflineFolderRenamer(offlineRepository);
  const offlineFolderPathUpdater = new OfflineFolderPathUpdater(
    offlineRepository,
    offlineFolderMover,
    offlineFolderRenamer
  );
  const synchronizeOfflineModifications = new SynchronizeOfflineModifications(
    offlineRepository,
    repository,
    folderRenamer,
    eventRepository
  );

  const synchronizeOfflineModificationsOnFolderCreated =
    new SynchronizeOfflineModificationsOnFolderCreated(
      synchronizeOfflineModifications
    );

  const folderRepositoryInitiator = new FolderRepositoryInitializer(repository);

  const foldersPlaceholderCreator = new FoldersPlaceholderCreator(
    localFileSystem
  );

  const folderPlaceholderUpdater = new FolderPlaceholderUpdater(
    repository,
    localFileSystem,
    shredContainer.relativePathToAbsoluteConverter
  );

  return {
    folderCreator,
    folderFinder,
    folderDeleter,
    allParentFoldersStatusIsExists: allParentFoldersStatusIsExists,
    folderPathUpdater,
    folderByPartialSearcher,
    synchronizeOfflineModificationsOnFolderCreated,
    offline: {
      folderCreator: offlineFolderCreator,
      folderPathUpdater: offlineFolderPathUpdater,
      synchronizeOfflineModifications,
    },
    retrieveAllFolders: new RetrieveAllFolders(repository),
    folderRepositoryInitiator,
    foldersPlaceholderCreator,
    folderPlaceholderUpdater,
  };
}
