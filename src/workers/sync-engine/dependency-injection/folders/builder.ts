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
import { InMemoryFolderRepository } from '../../modules/folders/infrastructure/InMemoryFolderRepository';
import { InMemoryOfflineFolderRepository } from '../../modules/folders/infrastructure/InMemoryOfflineFolderRepository';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { DependencyInjectionStorageSdk } from '../common/strogaeSdk';
import { DependencyInjectionTraverserProvider } from '../common/traverser';
import { PlaceholderContainer } from '../placeholders/PlaceholdersContainer';
import { FoldersContainer } from './FoldersContainer';
import { SdkFoldersInternxtFileSystem } from 'workers/sync-engine/modules/folders/infrastructure/SdkFoldersInternxtFileSystem';

export async function buildFoldersContainer(
  placeholdersContainer: PlaceholderContainer
): Promise<FoldersContainer> {
  const clients = DependencyInjectionHttpClientsProvider.get();
  const traverser = DependencyInjectionTraverserProvider.get();
  const eventBus = DependencyInjectionEventBus.bus;
  const sdk = await DependencyInjectionStorageSdk.get();

  const repository = new InMemoryFolderRepository();

  const folderFinder = new FolderFinder(repository);

  const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(
    repository
  );

  const fileSystem = new SdkFoldersInternxtFileSystem(sdk, clients.drive);

  const folderDeleter = new FolderDeleter(
    fileSystem,
    repository,
    allParentFoldersStatusIsExists,
    placeholdersContainer.placeholderCreator
  );

  const folderCreator = new FolderCreator(
    fileSystem,
    repository,
    ipcRendererSyncEngine,
    eventBus
  );

  const folderMover = new FolderMover(fileSystem, repository, folderFinder);
  const folderRenamer = new FolderRenamer(
    fileSystem,
    repository,
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
  };
}
