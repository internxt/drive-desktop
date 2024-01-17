import crypt from '../../../../../context/shared/infrastructure/crypt';
import { CreateFileOnOfflineFileUploaded } from '../../../../../context/virtual-drive/files/application/CreateFileOnOfflineFileUplodaded';
import { FileCreator } from '../../../../../context/virtual-drive/files/application/FileCreator';
import { FileDeleter } from '../../../../../context/virtual-drive/files/application/FileDeleter';
import { FileFinderByContentsId } from '../../../../../context/virtual-drive/files/application/FileFinderByContentsId';
import { FilePathUpdater } from '../../../../../context/virtual-drive/files/application/FilePathUpdater';
import { FilesByFolderPathSearcher } from '../../../../../context/virtual-drive/files/application/FilesByFolderPathSearcher';
import { FilesSearcher } from '../../../../../context/virtual-drive/files/application/FilesSearcher';
import { RepositoryPopulator } from '../../../../../context/virtual-drive/files/application/RepositoryPopulator';
import { SameFileWasMoved } from '../../../../../context/virtual-drive/files/application/SameFileWasMoved';
import { File } from '../../../../../context/virtual-drive/files/domain/File';
import { FuseLocalFileSystem } from '../../../../../context/virtual-drive/files/infrastructure/FuseLocalFileSystem';
import { InMemoryFileRepository } from '../../../../../context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { MainProcessSyncFileMessenger } from '../../../../../context/virtual-drive/files/infrastructure/MainProcessFileSyncNotifier';
import { SDKRemoteFileSystem } from '../../../../../context/virtual-drive/files/infrastructure/SDKRemoteFileSystem';
import { DependencyInjectionEventBus } from '../../common/eventBus';
import { DependencyInjectionEventRepository } from '../../common/eventRepository';
import { DependencyInjectionStorageSdk } from '../../common/sdk';
import { DependencyInjectionUserProvider } from '../../common/user';
import { FoldersContainer } from '../folders/FoldersContainer';
import { SharedContainer } from '../shared/SharedContainer';
import { FilesContainer } from './FilesContainer';

export async function buildFilesContainer(
  initialFiles: Array<File>,
  folderContainer: FoldersContainer,
  sharedContainer: SharedContainer
): Promise<FilesContainer> {
  const repository = new InMemoryFileRepository();
  const eventRepository = DependencyInjectionEventRepository.get();
  const user = DependencyInjectionUserProvider.get();
  const sdk = await DependencyInjectionStorageSdk.get();
  const { bus: eventBus } = DependencyInjectionEventBus;

  const repositoryPopulator = new RepositoryPopulator(repository);

  await repositoryPopulator.run(initialFiles);

  const syncFileMessenger = new MainProcessSyncFileMessenger();

  const filesByFolderPathNameLister = new FilesByFolderPathSearcher(
    repository,
    folderContainer.folderFinder
  );

  const filesSearcher = new FilesSearcher(repository);

  const remoteFileSystem = new SDKRemoteFileSystem(sdk, crypt, user.bucket);
  const localFileSystem = new FuseLocalFileSystem(
    sharedContainer.relativePathToAbsoluteConverter
  );

  const fileFinderByContentsId = new FileFinderByContentsId(repository);

  const filePathUpdater = new FilePathUpdater(
    remoteFileSystem,
    localFileSystem,
    repository,
    fileFinderByContentsId,
    folderContainer.folderFinder,
    eventBus
  );

  const sameFileWasMoved = new SameFileWasMoved(
    repository,
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
    folderContainer.folderFinder,
    fileDeleter,
    eventBus,
    syncFileMessenger
  );

  const createFileOnOfflineFileUploaded = new CreateFileOnOfflineFileUploaded(
    fileCreator
  );

  return {
    filesByFolderPathNameLister,
    filesSearcher,
    filePathUpdater,
    sameFileWasMoved,
    fileCreator,
    fileDeleter,
    repositoryPopulator,

    // event handlers
    createFileOnOfflineFileUploaded,
  };
}
