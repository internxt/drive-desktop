import crypt from '../../../../../context/shared/infrastructure/crypt';
import { CreateFileOnOfflineFileUploaded } from '../../../../../context/virtual-drive/files/application/event-subsribers/CreateFileOnOfflineFileUplodaded';
import { FileCreator } from '../../../../../context/virtual-drive/files/application/FileCreator';
import { FileDeleter } from '../../../../../context/virtual-drive/files/application/FileDeleter';
import { FilePathUpdater } from '../../../../../context/virtual-drive/files/application/FilePathUpdater';
import { FilesByFolderPathSearcher } from '../../../../../context/virtual-drive/files/application/FilesByFolderPathSearcher';
import { FirstsFileSearcher } from '../../../../../context/virtual-drive/files/application/FirstsFileSearcher';
import { FileRepositoryInitializer } from '../../../../../context/virtual-drive/files/application/FileRepositoryInitializer';
import { SameFileWasMoved } from '../../../../../context/virtual-drive/files/application/SameFileWasMoved';
import { File } from '../../../../../context/virtual-drive/files/domain/File';
import { FuseLocalFileSystem } from '../../../../../context/virtual-drive/files/infrastructure/FuseLocalFileSystem';
import { MainProcessSyncFileMessenger } from '../../../../../context/virtual-drive/files/infrastructure/SyncFileMessengers/MainProcessSyncFileMessenger';
import { SDKRemoteFileSystem } from '../../../../../context/virtual-drive/files/infrastructure/SDKRemoteFileSystem';
import { DependencyInjectionHttpClientsProvider } from '../../common/clients';
import { DependencyInjectionEventBus } from '../../common/eventBus';
import { DependencyInjectionEventRepository } from '../../common/eventRepository';
import { DependencyInjectionStorageSdk } from '../../common/sdk';
import { DependencyInjectionUserProvider } from '../../common/user';
import { FoldersContainer } from '../folders/FoldersContainer';
import { FilesContainer } from './FilesContainer';
import { InMemoryFileRepositorySingleton } from '../../../../shared/dependency-injection/virtual-drive/files/InMemoryFileRepositorySingleton';
import { SingleFileMatchingSearcher } from '../../../../../context/virtual-drive/files/application/SingleFileMatchingSearcher';
import { FilesSearcherByPartialMatch } from '../../../../../context/virtual-drive/files/application/search-all/FilesSearcherByPartialMatch';
import { FileOverrider } from '../../../../../context/virtual-drive/files/application/override/FileOverrider';

export async function buildFilesContainer(
  initialFiles: Array<File>,
  folderContainer: FoldersContainer
): Promise<FilesContainer> {
  const repository = InMemoryFileRepositorySingleton.instance;
  const eventRepository = DependencyInjectionEventRepository.get();
  const user = DependencyInjectionUserProvider.get();
  const sdk = await DependencyInjectionStorageSdk.get();
  const { bus: eventBus } = DependencyInjectionEventBus;
  const clients = DependencyInjectionHttpClientsProvider.get();

  const repositoryPopulator = new FileRepositoryInitializer(repository);

  await repositoryPopulator.run(initialFiles);

  const syncFileMessenger = new MainProcessSyncFileMessenger();

  const filesByFolderPathNameLister = new FilesByFolderPathSearcher(
    repository,
    folderContainer.singleFolderMatchingFinder
  );

  const filesSearcher = new FirstsFileSearcher(repository);

  const remoteFileSystem = new SDKRemoteFileSystem(
    sdk,
    clients,
    crypt,
    user.bucket
  );
  const localFileSystem = new FuseLocalFileSystem();

  const singleFileMatchingSearcher = new SingleFileMatchingSearcher(repository);

  const filePathUpdater = new FilePathUpdater(
    remoteFileSystem,
    localFileSystem,
    repository,
    singleFileMatchingSearcher,
    folderContainer.parentFolderFinder,
    eventBus
  );

  const sameFileWasMoved = new SameFileWasMoved(
    singleFileMatchingSearcher,
    localFileSystem,
    eventRepository
  );

  const fileDeleter = new FileDeleter(
    remoteFileSystem,
    localFileSystem,
    repository,
    folderContainer.allParentFoldersStatusIsExists,
    syncFileMessenger
  );

  const fileCreator = new FileCreator(
    remoteFileSystem,
    repository,
    folderContainer.parentFolderFinder,
    fileDeleter,
    eventBus,
    syncFileMessenger
  );

  const fileOverrider = new FileOverrider(
    remoteFileSystem,
    repository,
    eventBus
  );

  const createFileOnOfflineFileUploaded = new CreateFileOnOfflineFileUploaded(
    fileCreator,
    fileOverrider
  );

  const filesSearcherByPartialMatch = new FilesSearcherByPartialMatch(
    repository
  );

  return {
    filesByFolderPathNameLister,
    filesSearcher,
    filePathUpdater,
    sameFileWasMoved,
    fileCreator,
    fileDeleter,
    repositoryPopulator,
    syncFileMessenger,
    filesSearcherByPartialMatch,
    // event handlers
    createFileOnOfflineFileUploaded,
  };
}
