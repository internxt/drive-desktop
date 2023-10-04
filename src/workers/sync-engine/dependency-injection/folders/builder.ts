import { AllParentFoldersStatusIsExists } from 'workers/sync-engine/modules/folders/application/AllParentFoldersStatusIsExists';
import { FolderByPartialSearcher } from 'workers/sync-engine/modules/folders/application/FolderByPartialSearcher';
import { FolderCreator } from 'workers/sync-engine/modules/folders/application/FolderCreator';
import { FolderDeleter } from 'workers/sync-engine/modules/folders/application/FolderDeleter';
import { FolderFinder } from 'workers/sync-engine/modules/folders/application/FolderFinder';
import { FolderMover } from 'workers/sync-engine/modules/folders/application/FolderMover';
import { FolderPathUpdater } from 'workers/sync-engine/modules/folders/application/FolderPathUpdater';
import { FolderRenamer } from 'workers/sync-engine/modules/folders/application/FolderRenamer';
import { FolderSearcher } from 'workers/sync-engine/modules/folders/application/FolderSearcher';
import { OfflineFolderCreator } from 'workers/sync-engine/modules/folders/application/Offline/OfflineFolderCreator';
import { OfflineFolderMover } from 'workers/sync-engine/modules/folders/application/Offline/OfflineFolderMover';
import { OfflineFolderPathUpdater } from 'workers/sync-engine/modules/folders/application/Offline/OfflineFolderPathUpdater';
import { OfflineFolderRenamer } from 'workers/sync-engine/modules/folders/application/Offline/OfflineFolderRenamer';
import { HttpFolderRepository } from 'workers/sync-engine/modules/folders/infrastructure/HttpFolderRepository';
import { InMemoryOfflineFolderRepository } from 'workers/sync-engine/modules/folders/infrastructure/InMemoryOfflineFolderRepository';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { DependencyInjectionTraverserProvider } from '../common/traverser';
import { PlaceholderContainer } from '../placeholders/PlaceholdersContainer';
import { FoldersContainer } from './FoldersContainer';
import { SynchronizeOfflineModifications } from 'workers/sync-engine/modules/folders/application/SynchronizeOfflineModifications';
import { SynchronizeOfflineModificationsOnFolderCreated } from 'workers/sync-engine/modules/folders/application/SynchronizeOfflineModificationsOnFolderCreated';

export async function buildFoldersContainer(
  placeholdersContainer: PlaceholderContainer
): Promise<FoldersContainer> {
  const clients = DependencyInjectionHttpClientsProvider.get();
  const traverser = DependencyInjectionTraverserProvider.get();
  const eventBus = DependencyInjectionEventBus.bus;

  const repository = new HttpFolderRepository(
    clients.drive,
    clients.newDrive,
    traverser,
    ipcRendererSyncEngine
  );

  await repository.init();

  const folderFinder = new FolderFinder(repository);

  const folderSearcher = new FolderSearcher(repository);

  const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(
    repository
  );

  const folderDeleter = new FolderDeleter(
    repository,
    allParentFoldersStatusIsExists,
    placeholdersContainer.placeholderCreator
  );

  const folderCreator = new FolderCreator(
    repository,
    folderFinder,
    ipcRendererSyncEngine,
    eventBus
  );

  const folderMover = new FolderMover(repository, folderFinder);
  const folderRenamer = new FolderRenamer(repository, ipcRendererSyncEngine);

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

  return {
    folderCreator,
    folderFinder,
    folderSearcher,
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
  };
}
