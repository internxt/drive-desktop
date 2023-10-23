import crypt from '../../../utils/crypt';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
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
import { RetrieveAllFiles } from '../../modules/files/application/RetrieveAllFiles';
import { SameFileWasMoved } from '../../modules/files/application/SameFileWasMoved';
import { HttpFileRepository } from '../../modules/files/infrastructure/HttpFileRepository';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { DependencyInjectionEventRepository } from '../common/eventRepository';
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
  const eventHistory = DependencyInjectionEventRepository.get();

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
    sharedContainer.localFileIdProvider,
    eventHistory
  );

  const filePathUpdater = new FilePathUpdater(
    fileRepository,
    fileFinderByContentsId,
    folderContainer.folderFinder,
    ipcRendererSyncEngine,
    sharedContainer.localFileIdProvider,
    eventBus
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

  const fileClearer = new FileClearer(fileRepository);

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
    managedFileRepository: fileRepository,
    sameFileWasMoved,
    retrieveAllFiles: new RetrieveAllFiles(fileRepository),
  };

  return { container, subscribers: [] };
}
