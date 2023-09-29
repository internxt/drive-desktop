import { FolderCreator } from '../../modules/folders/application/FolderCreator';
import { FolderDeleter } from '../../modules/folders/application/FolderDeleter';
import { FolderFinder } from '../../modules/folders/application/FolderFinder';
import { FolderPathCreator } from '../../modules/folders/application/FolderPathCreator';
import { FolderSearcher } from '../../modules/folders/application/FolderSearcher';
import { AllParentFoldersStatusIsExists } from '../../modules/folders/application/AllParentFoldersStatusIsExists';
import { HttpFolderRepository } from '../../modules/folders/infrastructure/HttpFolderRepository';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionLocalRootFolderPath } from '../common/localRootFolderPath';
import { DependencyInjectionTraverserProvider } from '../common/traverser';
import { FoldersContainer } from './FoldersContainer';
import { FolderPathUpdater } from '../../modules/folders/application/FolderPathUpdater';
import { FolderMover } from '../../modules/folders/application/FolderMover';
import { FolderRenamer } from '../../modules/folders/application/FolderRenamer';
import { PlaceholderContainer } from '../placeholders/PlaceholdersContainer';
import { FolderClearer } from '../../modules/folders/application/FolderClearer';

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

  const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(
    repository
  );

  const folderDeleter = new FolderDeleter(
    repository,
    allParentFoldersStatusIsExists,
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

  const folderClearer = new FolderClearer(repository);

  return {
    folderCreator,
    folderFinder,
    folderPathFromAbsolutePathCreator,
    folderSearcher,
    folderDeleter,
    allParentFoldersStatusIsExists: allParentFoldersStatusIsExists,
    folderPathUpdater,
    folderClearer,
  };
}
