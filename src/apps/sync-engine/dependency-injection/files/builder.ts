import crypt from '../../../../context/shared/infrastructure/crypt';
import { CreateFilePlaceholderOnDeletionFailed } from '../../../../context/virtual-drive/files/application/CreateFilePlaceholderOnDeletionFailed';
import { FileCreator } from '../../../../context/virtual-drive/files/application/FileCreator';
import { FileDeleter } from '../../../../context/virtual-drive/files/application/FileDeleter';
import { FileFinderByContentsId } from '../../../../context/virtual-drive/files/application/FileFinderByContentsId';
import { FilePathUpdater } from '../../../../context/virtual-drive/files/application/FilePathUpdater';
import { FilePlaceholderCreatorFromContentsId } from '../../../../context/virtual-drive/files/application/FilePlaceholderCreatorFromContentsId';
import { FilesPlaceholderUpdater } from '../../../../context/virtual-drive/files/application/FilesPlaceholderUpdater';
import { FilesPlaceholderCreator } from '../../../../context/virtual-drive/files/application/FilesPlaceholdersCreator';
import { RepositoryPopulator } from '../../../../context/virtual-drive/files/application/RepositoryPopulator';
import { RetrieveAllFiles } from '../../../../context/virtual-drive/files/application/RetrieveAllFiles';
import { SameFileWasMoved } from '../../../../context/virtual-drive/files/application/SameFileWasMoved';
import { InMemoryFileRepository } from '../../../../context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { NodeWinLocalFileSystem } from '../../../../context/virtual-drive/files/infrastructure/NodeWinLocalFileSystem';
import { SDKRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/SDKRemoteFileSystem';
import { BackgroundProcessSyncFileMessenger } from '../../../../context/virtual-drive/files/infrastructure/SyncFileMessengers/BackgroundProcessSyncFileMessenger';
import { LocalFileIdProvider } from '../../../../context/virtual-drive/shared/application/LocalFileIdProvider';
import { SyncEngineIPC } from '../../SyncEngineIpc';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { DependencyInjectionEventRepository } from '../common/eventRepository';
import { DependencyInjectionStorageSdk } from '../common/sdk';
import { DependencyInjectionUserProvider } from '../common/user';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { FoldersContainer } from '../folders/FoldersContainer';
import { SharedContainer } from '../shared/SharedContainer';
import { FilesContainer } from './FilesContainer';

export async function buildFilesContainer(
  folderContainer: FoldersContainer,
  sharedContainer: SharedContainer
): Promise<{
  container: FilesContainer;
  subscribers: any;
}> {
  const user = DependencyInjectionUserProvider.get();
  const { bus: eventBus } = DependencyInjectionEventBus;
  const eventHistory = DependencyInjectionEventRepository.get();
  const { virtualDrive } = DependencyInjectionVirtualDrive;
  const sdk = await DependencyInjectionStorageSdk.get();

  const clients = DependencyInjectionHttpClientsProvider.get();

  const remoteFileSystem = new SDKRemoteFileSystem(
    sdk,
    clients,
    crypt,
    user.bucket
  );
  const localFileSystem = new NodeWinLocalFileSystem(
    virtualDrive,
    sharedContainer.relativePathToAbsoluteConverter
  );

  const syncFileMessenger = new BackgroundProcessSyncFileMessenger(
    SyncEngineIPC
  );

  const repository = new InMemoryFileRepository();

  const fileFinderByContentsId = new FileFinderByContentsId(repository);

  const fileDeleter = new FileDeleter(
    remoteFileSystem,
    localFileSystem,
    repository,
    folderContainer.allParentFoldersStatusIsExists,
    syncFileMessenger
  );

  const sameFileWasMoved = new SameFileWasMoved(
    repository,
    localFileSystem,
    eventHistory
  );

  const filePathUpdater = new FilePathUpdater(
    remoteFileSystem,
    localFileSystem,
    repository,
    folderContainer.folderFinder,
    eventBus
  );

  const fileCreator = new FileCreator(
    remoteFileSystem,
    repository,
    folderContainer.folderFinder,
    fileDeleter,
    eventBus,
    syncFileMessenger
  );

  const filePlaceholderCreatorFromContentsId =
    new FilePlaceholderCreatorFromContentsId(
      fileFinderByContentsId,
      localFileSystem
    );

  const createFilePlaceholderOnDeletionFailed =
    new CreateFilePlaceholderOnDeletionFailed(
      filePlaceholderCreatorFromContentsId
    );

  const repositoryPopulator = new RepositoryPopulator(repository);

  const filesPlaceholderCreator = new FilesPlaceholderCreator(localFileSystem);

  const localFileIdProvider = new LocalFileIdProvider(
    sharedContainer.relativePathToAbsoluteConverter
  );

  const filesPlaceholderUpdater = new FilesPlaceholderUpdater(
    repository,
    localFileSystem,
    sharedContainer.relativePathToAbsoluteConverter,
    localFileIdProvider,
    eventHistory
  );

  const container: FilesContainer = {
    fileFinderByContentsId,
    fileDeleter,
    filePathUpdater,
    fileCreator,
    filePlaceholderCreatorFromContentsId: filePlaceholderCreatorFromContentsId,
    createFilePlaceholderOnDeletionFailed:
      createFilePlaceholderOnDeletionFailed,
    sameFileWasMoved,
    retrieveAllFiles: new RetrieveAllFiles(repository),
    repositoryPopulator: repositoryPopulator,
    filesPlaceholderCreator,
    filesPlaceholderUpdater,
  };

  return { container, subscribers: [] };
}
