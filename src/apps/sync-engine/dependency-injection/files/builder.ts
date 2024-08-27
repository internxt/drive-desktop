import { FileFinder } from './../../../../context/virtual-drive/files/application/FileFinder';
import crypt from '../../../../context/shared/infrastructure/crypt';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { DependencyInjectionEventRepository } from '../common/eventRepository';
import { DependencyInjectionUserProvider } from '../common/user';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { FoldersContainer } from '../folders/FoldersContainer';
import { SharedContainer } from '../shared/SharedContainer';
import { FilesContainer } from './FilesContainer';
import { DependencyInjectionStorageSdk } from '../common/sdk';
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
import { SDKRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/SDKRemoteFileSystem';
import { NodeWinLocalFileSystem } from '../../../../context/virtual-drive/files/infrastructure/NodeWinLocalFileSystem';
import { LocalFileIdProvider } from '../../../../context/virtual-drive/shared/application/LocalFileIdProvider';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { FileFolderContainerDetector } from '../../../../context/virtual-drive/files/application/FileFolderContainerDetector';
import { FileSyncronizer } from '../../../../context/virtual-drive/files/application/FileSyncronizer';
import { FilePlaceholderConverter } from '../../../../context/virtual-drive/files/application/FIlePlaceholderConverter';
import { FileSyncStatusUpdater } from '../../../../context/virtual-drive/files/application/FileSyncStatusUpdater';
import { FileContentsUpdater } from '../../../../context/virtual-drive/files/application/FileContentsUpdater';
import { FileCheckerStatusInRoot } from '../../../../context/virtual-drive/files/application/FileCheckerStatusInRoot';
import { FilesPlaceholderDeleter } from '../../../../context/virtual-drive/files/application/FilesPlaceholderDeleter';
import { FileIdentityUpdater } from '../../../../context/virtual-drive/files/application/FileIndetityUpdater';

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

  const repository = new InMemoryFileRepository();

  const fileFinderByContentsId = new FileFinderByContentsId(repository);

  const fileDeleter = new FileDeleter(
    remoteFileSystem,
    localFileSystem,
    repository,
    folderContainer.allParentFoldersStatusIsExists,
    ipcRendererSyncEngine
  );

  const fileFolderContainerDetector = new FileFolderContainerDetector(
    repository,
    folderContainer.folderFinder
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
    fileFinderByContentsId,
    folderContainer.folderFinder,
    ipcRendererSyncEngine,
    eventBus
  );

  const fileFinder = new FileFinder(repository);

  const fileCreator = new FileCreator(
    remoteFileSystem,
    repository,
    folderContainer.folderFinder,
    fileDeleter,
    eventBus,
    ipcRendererSyncEngine
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

  const filesPlaceholderDeleter = new FilesPlaceholderDeleter(
    remoteFileSystem,
    sharedContainer.relativePathToAbsoluteConverter,
    localFileSystem
  );

  const filePlaceholderConverter = new FilePlaceholderConverter(
    localFileSystem
  );

  const fileSyncStatusUpdater = new FileSyncStatusUpdater(localFileSystem);

  const fileContentsUpdater = new FileContentsUpdater(
    repository,
    remoteFileSystem
  );

  const fileIdentityUpdater = new FileIdentityUpdater(localFileSystem);

  const fileSyncronizer = new FileSyncronizer(
    repository,
    fileSyncStatusUpdater,
    filePlaceholderConverter,
    fileIdentityUpdater,
    fileCreator,
    sharedContainer.absolutePathToRelativeConverter,
    folderContainer.folderCreator,
    folderContainer.offline.folderCreator,
    fileContentsUpdater
  );

  const filesCheckerStatusInRoot = new FileCheckerStatusInRoot(localFileSystem);

  const container: FilesContainer = {
    fileFinderByContentsId,
    fileFinder,
    fileDeleter,
    filePathUpdater,
    fileCreator,
    fileFolderContainerDetector,
    fileSyncronizer,
    filePlaceholderCreatorFromContentsId: filePlaceholderCreatorFromContentsId,
    createFilePlaceholderOnDeletionFailed:
      createFilePlaceholderOnDeletionFailed,
    sameFileWasMoved,
    retrieveAllFiles: new RetrieveAllFiles(repository),
    repositoryPopulator: repositoryPopulator,
    filesPlaceholderCreator,
    filesPlaceholderUpdater,
    filesPlaceholderDeleter,
    filePlaceholderConverter,
    fileSyncStatusUpdater,
    filesCheckerStatusInRoot,
    fileIdentityUpdater,
  };

  return { container, subscribers: [] };
}
