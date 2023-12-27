import crypt from '../../../../context/shared/infrastructure/crypt';
import { FileFinderByContentsId } from '../../../../context/virtual-drive/files/application/FileFinderByContentsId';
import { FilePathUpdater } from '../../../../context/virtual-drive/files/application/FilePathUpdater';
import { FilesByFolderPathSearcher } from '../../../../context/virtual-drive/files/application/FilesByFolderPathSearcher';
import { FilesSearcher } from '../../../../context/virtual-drive/files/application/FilesSearcher';
import { RepositoryPopulator } from '../../../../context/virtual-drive/files/application/RepositoryPopulator';
import { File } from '../../../../context/virtual-drive/files/domain/File';
import { FuseLocalFileSystem } from '../../../../context/virtual-drive/files/infrastructure/FuseLocalFileSystem';
import { InMemoryFileRepository } from '../../../../context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { SDKRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/SDKRemoteFileSystem';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { DependencyInjectionStorageSdk } from '../common/sdk';
import { DependencyInjectionUserProvider } from '../common/user';
import { FoldersContainer } from '../folders/FoldersContainer';
import { SharedContainer } from '../shared/SharedContainer';
import { FilesContainer } from './FilesContainer';

export async function buildFilesContainer(
  initialFiles: Array<File>,
  folderContainer: FoldersContainer,
  sharedContainer: SharedContainer
): Promise<FilesContainer> {
  const repository = new InMemoryFileRepository();

  const user = DependencyInjectionUserProvider.get();
  const sdk = await DependencyInjectionStorageSdk.get();
  const { bus: eventBus } = DependencyInjectionEventBus;
  const repositoryPopulator = new RepositoryPopulator(repository);

  await repositoryPopulator.run(initialFiles);

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

  return {
    filesByFolderPathNameLister,
    filesSearcher,
    filePathUpdater,
  };
}
