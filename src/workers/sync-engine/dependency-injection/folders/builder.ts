import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { AllParentFoldersStatusIsExists } from '../../modules/folders/application/AllParentFoldersStatusIsExists';
import { FolderByPartialSearcher } from '../../modules/folders/application/FolderByPartialSearcher';
import { FolderClearer } from '../../modules/folders/application/FolderClearer';
import { FolderCreator } from '../../modules/folders/application/FolderCreator';
import { FolderDeleter } from '../../modules/folders/application/FolderDeleter';
import { FolderFinder } from '../../modules/folders/application/FolderFinder';
import { FolderMover } from '../../modules/folders/application/FolderMover';
import { FolderPathUpdater } from '../../modules/folders/application/FolderPathUpdater';
import { FolderRenamer } from '../../modules/folders/application/FolderRenamer';
import { FolderSearcher } from '../../modules/folders/application/FolderSearcher';
import { OfflineFolderCreator } from '../../modules/folders/application/Offline/OfflineFolderCreator';
import { OfflineFolderMover } from '../../modules/folders/application/Offline/OfflineFolderMover';
import { OfflineFolderPathUpdater } from '../../modules/folders/application/Offline/OfflineFolderPathUpdater';
import { OfflineFolderRenamer } from '../../modules/folders/application/Offline/OfflineFolderRenamer';
import { SynchronizeOfflineModifications } from '../../modules/folders/application/SynchronizeOfflineModifications';
import { SynchronizeOfflineModificationsOnFolderCreated } from '../../modules/folders/application/SynchronizeOfflineModificationsOnFolderCreated';
import { HttpFolderRepository } from '../../modules/folders/infrastructure/HttpFolderRepository';
import { InMemoryOfflineFolderRepository } from '../../modules/folders/infrastructure/InMemoryOfflineFolderRepository';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { DependencyInjectionTraverserProvider } from '../common/traverser';
import { PlaceholderContainer } from '../placeholders/PlaceholdersContainer';
import { FoldersContainer } from './FoldersContainer';

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

  const folderClearer = new FolderClearer(repository);
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
    folderClearer,
    folderByPartialSearcher,
    synchronizeOfflineModificationsOnFolderCreated,
    offline: {
      folderCreator: offlineFolderCreator,
      folderPathUpdater: offlineFolderPathUpdater,
      synchronizeOfflineModifications,
    },
    managedFolderRepository: repository,
  };
}
