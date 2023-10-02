import { FolderCreator } from 'workers/sync-engine/modules/folders/application/FolderCreator';
import { FolderDeleter } from 'workers/sync-engine/modules/folders/application/FolderDeleter';
import { FolderFinder } from 'workers/sync-engine/modules/folders/application/FolderFinder';
import { FolderPathCreator } from 'workers/sync-engine/modules/folders/application/FolderPathCreator';
import { FolderSearcher } from 'workers/sync-engine/modules/folders/application/FolderSearcher';
import { AllParentFoldersStatusIsExists } from 'workers/sync-engine/modules/folders/application/AllParentFoldersStatusIsExists';
import { HttpFolderRepository } from 'workers/sync-engine/modules/folders/infrastructure/HttpFolderRepository';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionLocalRootFolderPath } from '../common/localRootFolderPath';
import { DependencyInjectionTraverserProvider } from '../common/traverser';
import { FoldersContainer } from './FoldersContainer';
import { FolderPathUpdater } from 'workers/sync-engine/modules/folders/application/FolderPathUpdater';
import { FolderMover } from 'workers/sync-engine/modules/folders/application/FolderMover';
import { FolderRenamer } from 'workers/sync-engine/modules/folders/application/FolderRenamer';
import { PlaceholderContainer } from '../placeholders/PlaceholdersContainer';
import { FolderByPartialSearcher } from 'workers/sync-engine/modules/folders/application/FolderByPartialSearcher';
import { InMemoryOfflineFolderRepository } from 'workers/sync-engine/modules/folders/infrastructure/InMemoryOfflineFolderRepository';
import { OfflineFolderCreator } from 'workers/sync-engine/modules/folders/application/Offline/OfflineFolderCreator';
import { OfflineFolderPathUpdater } from 'workers/sync-engine/modules/folders/application/Offline/OfflineFolderPathUpdater';
import { OfflineFolderMover } from 'workers/sync-engine/modules/folders/application/Offline/OfflineFolderMover';
import { OfflineFolderRenamer } from 'workers/sync-engine/modules/folders/application/Offline/OfflineFolderRenamer';

export async function buildFoldersContainer(
  placeholdersContainer: PlaceholderContainer
): Promise<FoldersContainer> {
  const clients = DependencyInjectionHttpClientsProvider.get();
  const traverser = DependencyInjectionTraverserProvider.get();
  const rootFolderPath = DependencyInjectionLocalRootFolderPath.get();

  const repository = new HttpFolderRepository(
    clients.drive,
    clients.newDrive,
    traverser,
    ipcRendererSyncEngine
  );

  await repository.init();
  const folderPathCreator = new FolderPathCreator(rootFolderPath);

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
    ipcRendererSyncEngine
  );

  const folderMover = new FolderMover(repository, folderFinder);
  const folderRenamer = new FolderRenamer(repository, ipcRendererSyncEngine);

  const folderByPartialSearcher = new FolderByPartialSearcher(repository);

  const folderPathUpdater = new FolderPathUpdater(
    repository,
    folderPathCreator,
    folderMover,
    folderRenamer
  );

  const offlineRepository = new InMemoryOfflineFolderRepository();
  const offlineFolderCreator = new OfflineFolderCreator(
    folderPathCreator,
    folderFinder,
    offlineRepository
  );

  const offlineFolderMover = new OfflineFolderMover(
    offlineRepository,
    folderFinder
  );
  const offlineFolderRenamer = new OfflineFolderRenamer(offlineRepository);
  const offlineFolderPathUpdater = new OfflineFolderPathUpdater(
    offlineRepository,
    folderPathCreator,
    offlineFolderMover,
    offlineFolderRenamer
  );

  return {
    folderCreator,
    folderFinder,
    folderPathFromAbsolutePathCreator: folderPathCreator,
    folderSearcher,
    folderDeleter,
    allParentFoldersStatusIsExists: allParentFoldersStatusIsExists,
    folderPathUpdater,
    folderByPartialSearcher,
    offline: {
      folderCreator: offlineFolderCreator,
      folderPathUpdater: offlineFolderPathUpdater,
    },
  };
}
