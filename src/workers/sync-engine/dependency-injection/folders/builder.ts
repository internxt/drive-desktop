import { FolderCreator } from 'workers/sync-engine/modules/folders/application/FolderCreator';
import { FolderDeleter } from 'workers/sync-engine/modules/folders/application/FolderDeleter';
import { FolderFinder } from 'workers/sync-engine/modules/folders/application/FolderFinder';
import { FolderPathCreator } from 'workers/sync-engine/modules/folders/application/FolderPathCreator';
import { FolderSearcher } from 'workers/sync-engine/modules/folders/application/FolderSearcher';
import { ParentFoldersExistForDeletion } from 'workers/sync-engine/modules/folders/application/ParentFoldersExistForDeletion';
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
  const folderPathFromAbsolutePathCreator = new FolderPathCreator(
    rootFolderPath
  );

  const folderFinder = new FolderFinder(repository);

  const folderSearcher = new FolderSearcher(repository);

  const parentFoldersExistForDeletion = new ParentFoldersExistForDeletion(
    repository
  );

  const folderDeleter = new FolderDeleter(
    repository,
    parentFoldersExistForDeletion,
    placeholdersContainer.placeholderCreator
  );

  const folderCreator = new FolderCreator(
    folderPathFromAbsolutePathCreator,
    repository,
    folderFinder,
    ipcRendererSyncEngine
  );

  const folderMover = new FolderMover(repository, folderFinder);
  const folderRenamer = new FolderRenamer(repository, ipcRendererSyncEngine);

  const folderPathUpdater = new FolderPathUpdater(
    repository,
    folderPathFromAbsolutePathCreator,
    folderMover,
    folderRenamer
  );

  return {
    folderCreator,
    folderFinder,
    folderPathFromAbsolutePathCreator,
    folderSearcher,
    folderDeleter,
    parentFoldersExistForDeletion,
    folderPathUpdater,
  };
}
