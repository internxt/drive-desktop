import { InMemoryFolderRepository } from 'workers/sync-engine/modules/folders/infrastructure/InMemoryFolderRepository';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { AllParentFoldersStatusIsExists } from '../../modules/folders/application/AllParentFoldersStatusIsExists';
import { FolderByPartialSearcher } from '../../modules/folders/application/FolderByPartialSearcher';
import { FolderCreator } from '../../modules/folders/application/FolderCreator';
import { FolderDeleter } from '../../modules/folders/application/FolderDeleter';
import { FolderFinder } from '../../modules/folders/application/FolderFinder';
import { FolderMover } from '../../modules/folders/application/FolderMover';
import { FolderPathUpdater } from '../../modules/folders/application/FolderPathUpdater';
import { FolderRenamer } from '../../modules/folders/application/FolderRenamer';
import { OfflineFolderCreator } from '../../modules/folders/application/Offline/OfflineFolderCreator';
import { OfflineFolderMover } from '../../modules/folders/application/Offline/OfflineFolderMover';
import { OfflineFolderPathUpdater } from '../../modules/folders/application/Offline/OfflineFolderPathUpdater';
import { OfflineFolderRenamer } from '../../modules/folders/application/Offline/OfflineFolderRenamer';
import { RetrieveAllFolders } from '../../modules/folders/application/RetrieveAllFolders';
import { SynchronizeOfflineModifications } from '../../modules/folders/application/SynchronizeOfflineModifications';
import { SynchronizeOfflineModificationsOnFolderCreated } from '../../modules/folders/application/SynchronizeOfflineModificationsOnFolderCreated';
import { HttpRemoteFileSystem } from '../../modules/folders/infrastructure/HttpRemoteFileSystem';
import { InMemoryOfflineFolderRepository } from '../../modules/folders/infrastructure/InMemoryOfflineFolderRepository';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { FoldersContainer } from './FoldersContainer';
import { NodeWinLocalFileSystem } from '../../modules/folders/infrastructure/NodeWinLocalFileSystem';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { FolderRepositoryInitiator } from 'workers/sync-engine/modules/folders/application/FolderRepositoryInitiator';

export async function buildFoldersContainer(): Promise<FoldersContainer> {
  const clients = DependencyInjectionHttpClientsProvider.get();
  const eventBus = DependencyInjectionEventBus.bus;
  const { virtualDrive } = DependencyInjectionVirtualDrive;

  const repository = new InMemoryFolderRepository();

  const localFileSystem = new NodeWinLocalFileSystem(virtualDrive);
  const remoteFileSystem = new HttpRemoteFileSystem(
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

  const folderCreator = new FolderCreator(
    repository,
    remoteFileSystem,
    ipcRendererSyncEngine,
    eventBus
  );

  const folderMover = new FolderMover(
    repository,
    remoteFileSystem,
    folderFinder
  );
  const folderRenamer = new FolderRenamer(
    repository,
    remoteFileSystem,
    ipcRendererSyncEngine
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
    folderRenamer
  );

  const synchronizeOfflineModificationsOnFolderCreated =
    new SynchronizeOfflineModificationsOnFolderCreated(
      synchronizeOfflineModifications
    );

  const folderRepositoryInitiator = new FolderRepositoryInitiator(repository);

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
  };
}
