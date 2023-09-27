import { FolderCreator } from 'workers/sync-engine/modules/folders/application/FolderCreator';
import { FolderDeleter } from 'workers/sync-engine/modules/folders/application/FolderDeleter';
import { FolderFinder } from 'workers/sync-engine/modules/folders/application/FolderFinder';
import { FolderPathFromAbsolutePathCreator } from 'workers/sync-engine/modules/folders/application/FolderPathFromAbsolutePathCreator';
import { FolderSearcher } from 'workers/sync-engine/modules/folders/application/FolderSearcher';
import { ParentFoldersExistForDeletion } from 'workers/sync-engine/modules/folders/application/ParentFoldersExistForDeletion';
import { FolderPlaceholderCreator } from 'workers/sync-engine/modules/folders/infrastructure/FolderPlaceholderCreator';
import { HttpFolderRepository } from 'workers/sync-engine/modules/folders/infrastructure/HttpFolderRepository';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionLocalRootFolderPath } from '../common/localRootFolderPath';
import { DependencyInjectionTraverserProvider } from '../common/traverser';
import { FoldersContainer } from './FoldersContainer';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';

export async function buildFoldersContainer(): Promise<FoldersContainer> {
  const clients = DependencyInjectionHttpClientsProvider.get();
  const traverser = DependencyInjectionTraverserProvider.get();
  const rootFolderPath = DependencyInjectionLocalRootFolderPath.get();
  const { virtualDrive } = DependencyInjectionVirtualDrive;

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

  const parentFoldersExistForDeletion = new ParentFoldersExistForDeletion(
    repository
  );

  const folderPlaceholderCreator = new FolderPlaceholderCreator(virtualDrive);

  const folderDeleter = new FolderDeleter(
    repository,
    parentFoldersExistForDeletion,
    folderPlaceholderCreator
  );

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
    parentFoldersExistForDeletion,
    folderPlaceholderCreator,
  };
}
