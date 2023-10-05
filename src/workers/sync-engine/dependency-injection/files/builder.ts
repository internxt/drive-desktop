import { CreateFilePlaceholderOnDeletionFailed } from 'workers/sync-engine/modules/files/application/CreateFilePlaceholderOnDeletionFailed';
import { FilePlaceholderCreatorFromContentsId } from 'workers/sync-engine/modules/files/application/FilePlaceholderCreatorFromContentsId';
import crypt from '../../../utils/crypt';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { FileByPartialSearcher } from '../../modules/files/application/FileByPartialSearcher';
import { FileCreator } from '../../modules/files/application/FileCreator';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { FileFinderByContentsId } from '../../modules/files/application/FileFinderByContentsId';
import { FilePathUpdater } from '../../modules/files/application/FilePathUpdater';
import { FileSearcher } from '../../modules/files/application/FileSearcher';
import { LocalRepositoryRepositoryRefresher } from '../../modules/files/application/LocalRepositoryRepositoryRefresher';
import { HttpFileRepository } from '../../modules/files/infrastructure/HttpFileRepository';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { DependencyInjectionTraverserProvider } from '../common/traverser';
import { DependencyInjectionUserProvider } from '../common/user';
import { FoldersContainer } from '../folders/FoldersContainer';
import { PlaceholderContainer } from '../placeholders/PlaceholdersContainer';
import { FilesContainer } from './FilesContainer';
import { SharedContainer } from '../shared/SharedContainer';
import { SameFileWasMoved } from 'workers/sync-engine/modules/files/application/SameFileWasMoved';

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

  const fileRepository = new HttpFileRepository(
    crypt,
    clients.drive,
    clients.newDrive,
    traverser,
    user.bucket,
    ipcRendererSyncEngine
  );

  await fileRepository.init();

  const fileFinderByContentsId = new FileFinderByContentsId(fileRepository);

  const localRepositoryRefresher = new LocalRepositoryRepositoryRefresher(
    ipcRendererSyncEngine,
    fileRepository
  );

  const fileDeleter = new FileDeleter(
    fileRepository,
    folderContainer.allParentFoldersStatusIsExists,
    placeholderContainer.placeholderCreator,
    ipcRendererSyncEngine
  );

  const fileByPartialSearcher = new FileByPartialSearcher(fileRepository);

  const sameFileWasMoved = new SameFileWasMoved(
    fileByPartialSearcher,
    sharedContainer.localFileIdProvider
  );

  const filePathUpdater = new FilePathUpdater(
    fileRepository,
    fileFinderByContentsId,
    folderContainer.folderFinder,
    ipcRendererSyncEngine,
    sharedContainer.localFileIdProvider
  );

  const fileCreator = new FileCreator(
    fileRepository,
    folderContainer.folderFinder,
    fileDeleter,
    eventBus,
    ipcRendererSyncEngine
  );

  const fileSearcher = new FileSearcher(fileRepository);

  const filePlaceholderCreatorFromContentsId =
    new FilePlaceholderCreatorFromContentsId(
      fileFinderByContentsId,
      placeholderContainer.placeholderCreator
    );

  const createFilePlaceholderOnDeletionFailed =
    new CreateFilePlaceholderOnDeletionFailed(
      filePlaceholderCreatorFromContentsId
    );

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
    sameFileWasMoved,
  };

  return { container, subscribers: [] };
}
