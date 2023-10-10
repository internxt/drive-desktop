import crypt from '../../../utils/crypt';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { ChildrenFilesSearcher } from '../../modules/files/application/ChildrenFilesSearcher';
import { CreateFilePlaceholderOnDeletionFailed } from '../../modules/files/application/CreateFilePlaceholderOnDeletionFailed';
import { FileByPartialSearcher } from '../../modules/files/application/FileByPartialSearcher';
import { FileClearer } from '../../modules/files/application/FileClearer';
import { FileCreator } from '../../modules/files/application/FileCreator';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { FileFinderByContentsId } from '../../modules/files/application/FileFinderByContentsId';
import { FilePathUpdater } from '../../modules/files/application/FilePathUpdater';
import { FilePlaceholderCreatorFromContentsId } from '../../modules/files/application/FilePlaceholderCreatorFromContentsId';
import { FileSearcher } from '../../modules/files/application/FileSearcher';
import { LocalRepositoryRepositoryRefresher } from '../../modules/files/application/LocalRepositoryRepositoryRefresher';
import { SameFileWasMoved } from '../../modules/files/application/SameFileWasMoved';
import { HttpFileRepository } from '../../modules/files/infrastructure/HttpFileRepository';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { DependencyInjectionEventHistory } from '../common/eventHistory';
import { DependencyInjectionTraverserProvider } from '../common/traverser';
import { DependencyInjectionUserProvider } from '../common/user';
import { FoldersContainer } from '../folders/FoldersContainer';
import { PlaceholderContainer } from '../placeholders/PlaceholdersContainer';
import { SharedContainer } from '../shared/SharedContainer';
import { FilesContainer } from './FilesContainer';

export async function buildFilesContainer(
  folderContainer: FoldersContainer,
  placeholderContainer: PlaceholderContainer,
  sharedContainer: SharedContainer
): Promise<{
  container: FilesContainer;
  subscribers: any;
}> {
  const clients = DependencyInjectionHttpClientsProvider.get();
  const traverser = DependencyInjectionTraverserProvider.get();
  const user = DependencyInjectionUserProvider.get();
  const { bus: eventBus } = DependencyInjectionEventBus;
  const eventHistory = DependencyInjectionEventHistory.get();

  const repository = new HttpFileRepository(
    crypt,
    clients.drive,
    clients.newDrive,
    traverser,
    user.bucket,
    ipcRendererSyncEngine
  );

  await repository.init();

  const fileFinderByContentsId = new FileFinderByContentsId(repository);

  const localRepositoryRefresher = new LocalRepositoryRepositoryRefresher(
    ipcRendererSyncEngine,
    repository
  );

  const fileDeleter = new FileDeleter(
    repository,
    folderContainer.allParentFoldersStatusIsExists,
    placeholderContainer.placeholderCreator,
    ipcRendererSyncEngine
  );

  const fileByPartialSearcher = new FileByPartialSearcher(repository);

  const sameFileWasMoved = new SameFileWasMoved(
    fileByPartialSearcher,
    sharedContainer.localFileIdProvider,
    eventHistory
  );

  const filePathUpdater = new FilePathUpdater(
    repository,
    fileFinderByContentsId,
    folderContainer.folderFinder,
    ipcRendererSyncEngine,
    sharedContainer.localFileIdProvider,
    eventHistory
  );

  const fileCreator = new FileCreator(
    repository,
    folderContainer.folderFinder,
    fileDeleter,
    eventBus,
    ipcRendererSyncEngine
  );

  const fileSearcher = new FileSearcher(repository);

  const filePlaceholderCreatorFromContentsId =
    new FilePlaceholderCreatorFromContentsId(
      fileFinderByContentsId,
      placeholderContainer.placeholderCreator
    );

  const createFilePlaceholderOnDeletionFailed =
    new CreateFilePlaceholderOnDeletionFailed(
      filePlaceholderCreatorFromContentsId
    );

  const fileClearer = new FileClearer(repository);

  const childrenFilesSearcher = new ChildrenFilesSearcher(repository);

  const container: FilesContainer = {
    fileFinderByContentsId,
    localRepositoryRefresher: localRepositoryRefresher,
    fileDeleter,
    fileByPartialSearcher,
    filePathUpdater,
    fileCreator,
    fileSearcher,
    filePlaceholderCreatorFromContentsId: filePlaceholderCreatorFromContentsId,
    createFilePlaceholderOnDeletionFailed:
      createFilePlaceholderOnDeletionFailed,
    fileClearer,
    managedFileRepository: repository,
    sameFileWasMoved,
    childrenFilesSearcher,
  };

  return { container, subscribers: [] };
}
