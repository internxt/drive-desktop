import { FileRenamer } from 'workers/sync-engine/modules/files/application/FileRenamer';
import crypt from '../../../utils/crypt';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { CreateFilePlaceholderOnDeletionFailed } from '../../modules/files/application/CreateFilePlaceholderOnDeletionFailed';
import { FileByPartialSearcher } from '../../modules/files/application/FileByPartialSearcher';
import { FileCreator } from '../../modules/files/application/FileCreator';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { FileFinderByContentsId } from '../../modules/files/application/FileFinderByContentsId';
import { FilePathUpdater } from '../../modules/files/application/FilePathUpdater';
import { FilePlaceholderCreatorFromContentsId } from '../../modules/files/application/FilePlaceholderCreatorFromContentsId';
import { RetrieveAllFiles } from '../../modules/files/application/RetrieveAllFiles';
import { SameFileWasMoved } from '../../modules/files/application/SameFileWasMoved';
import { InMemoryFileRepository } from '../../modules/files/infrastructure/InMemoryFileRepository';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { DependencyInjectionEventRepository } from '../common/eventRepository';
import { DependencyInjectionUserProvider } from '../common/user';
import { FoldersContainer } from '../folders/FoldersContainer';
import { PlaceholderContainer } from '../placeholders/PlaceholdersContainer';
import { SharedContainer } from '../shared/SharedContainer';
import { FilesContainer } from './FilesContainer';
import { SdkFilesInternxtFileSystem } from 'workers/sync-engine/modules/files/infrastructure/SdkFilesInternxtFileSystem';
import { DependencyInjectionStorageSdk } from '../common/strogaeSdk';
import { FileMover } from 'workers/sync-engine/modules/files/application/FileMover';
import { PopulateFileRepository } from 'workers/sync-engine/modules/files/application/PopulateFileRepository';
import { ItemsContainer } from '../items/ItemsContainer';

export async function buildFilesContainer(
  folderContainer: FoldersContainer,
  placeholderContainer: PlaceholderContainer,
  itemsContainer: ItemsContainer,
  sharedContainer: SharedContainer
): Promise<{
  container: FilesContainer;
  subscribers: any;
}> {
  const user = DependencyInjectionUserProvider.get();
  const { bus: eventBus } = DependencyInjectionEventBus;
  const eventHistory = DependencyInjectionEventRepository.get();
  const sdk = await DependencyInjectionStorageSdk.get();

  const repository = new InMemoryFileRepository();

  const fileFinderByContentsId = new FileFinderByContentsId(repository);

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

  const fileSystem = new SdkFilesInternxtFileSystem(sdk, crypt, user.bucket);

  const fileRenamer = new FileRenamer(fileSystem, repository, eventBus);
  const fileMover = new FileMover(
    sharedContainer.localFileIdProvider,
    folderContainer.folderFinder,
    fileSystem,
    repository,
    eventBus
  );

  const filePathUpdater = new FilePathUpdater(
    repository,
    fileFinderByContentsId,
    fileRenamer,
    fileMover,
    ipcRendererSyncEngine
  );

  const fileCreator = new FileCreator(
    repository,
    fileSystem,
    folderContainer.folderFinder,
    fileDeleter,
    eventBus,
    ipcRendererSyncEngine
  );

  const filePlaceholderCreatorFromContentsId =
    new FilePlaceholderCreatorFromContentsId(
      fileFinderByContentsId,
      placeholderContainer.placeholderCreator
    );

  const createFilePlaceholderOnDeletionFailed =
    new CreateFilePlaceholderOnDeletionFailed(
      filePlaceholderCreatorFromContentsId
    );

  const populateFileRepository = new PopulateFileRepository(
    itemsContainer.existingItemsTraverser,
    repository
  );

  const container: FilesContainer = {
    fileFinderByContentsId,
    fileDeleter,
    fileByPartialSearcher,
    filePathUpdater,
    fileCreator,
    filePlaceholderCreatorFromContentsId: filePlaceholderCreatorFromContentsId,
    createFilePlaceholderOnDeletionFailed:
      createFilePlaceholderOnDeletionFailed,
    sameFileWasMoved,
    retrieveAllFiles: new RetrieveAllFiles(repository),
    fileRepository: repository,
    populateFileRepository,
  };

  return { container, subscribers: [] };
}
