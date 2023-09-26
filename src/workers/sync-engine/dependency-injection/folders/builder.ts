import { FolderCreator } from 'workers/sync-engine/modules/folders/application/FolderCreator';
import { FoldersContainer } from './FoldersContainer';
import { HttpFolderRepository } from 'workers/sync-engine/modules/folders/infrastructure/HttpFolderRepository';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionTraverserProvider } from '../common/traverser';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { FolderFinder } from 'workers/sync-engine/modules/folders/application/FolderFinder';
import { FolderPathFromAbsolutePathCreator } from 'workers/sync-engine/modules/folders/application/FolderPathFromAbsolutePathCreator';
import { DependencyInjectionLocalRootFolderPath } from '../common/localRootFolderPath';
import { FolderSearcher } from 'workers/sync-engine/modules/folders/application/FolderSearcher';
import { FolderDeleter } from 'workers/sync-engine/modules/folders/application/FolderDeleter';

export async function buildFoldersContainer(): Promise<FoldersContainer> {
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
  const folderPathFromAbsolutePathCreator =
    new FolderPathFromAbsolutePathCreator(rootFolderPath);

  const folderFinder = new FolderFinder(repository);

  const folderSearcher = new FolderSearcher(repository);

  const folderDeleter = new FolderDeleter(repository);

  const folderCreator = new FolderCreator(
    folderPathFromAbsolutePathCreator,
    repository,
    folderFinder,
    ipcRendererSyncEngine
  );

  return {
    folderCreator,
    folderFinder,
    folderPathFromAbsolutePathCreator,
    folderSearcher,
    folderDeleter,
  };
}
