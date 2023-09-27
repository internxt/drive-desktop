import crypt from '../../../utils/crypt';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { FileByPartialSearcher } from '../../modules/files/application/FileByPartialSearcher';
import { FileCreator } from '../../modules/files/application/FileCreator';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { FileFinderByContentsId } from '../../modules/files/application/FileFinderByContentsId';
import { FilePathFromAbsolutePathCreator } from '../../modules/files/application/FilePathFromAbsolutePathCreator';
import { FilePathUpdater } from '../../modules/files/application/FilePathUpdater';
import { FileSearcher } from '../../modules/files/application/FileSearcher';
import { LocalRepositoryRepositoryRefresher } from '../../modules/files/application/LocalRepositoryRepositoryRefresher';
import { HttpFileRepository } from '../../modules/files/infrastructure/HttpFileRepository';
import { NodeJsEventBus } from '../../modules/shared/infrastructure/DuplexEventBus';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionLocalRootFolderPath } from '../common/localRootFolderPath';
import { DependencyInjectionTraverserProvider } from '../common/traverser';
import { DependencyInjectionUserProvider } from '../common/user';
import { FoldersContainer } from '../folders/FoldersContainer';
import { FilesContainer } from './FilesContainer';

export async function buildFilesContainer(
  folderContainer: FoldersContainer
): Promise<FilesContainer> {
  const clients = DependencyInjectionHttpClientsProvider.get();
  const traverser = DependencyInjectionTraverserProvider.get();
  const user = DependencyInjectionUserProvider.get();
  const localRootFolderPath = DependencyInjectionLocalRootFolderPath.get();

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
    fileFinderByContentsId,
    folderContainer.parentFoldersExistForDeletion,
    ipcRendererSyncEngine
  );

  const fileByPartialSearcher = new FileByPartialSearcher(fileRepository);

  const filePathUpdater = new FilePathUpdater(
    fileRepository,
    fileFinderByContentsId,
    folderContainer.folderFinder
  );

  const fileCreator = new FileCreator(
    fileRepository,
    folderContainer.folderFinder,
    new NodeJsEventBus()
  );

  const filePathFromAbsolutePathCreator = new FilePathFromAbsolutePathCreator(
    localRootFolderPath
  );

  const fileSearcher = new FileSearcher(fileRepository);

  const container: FilesContainer = {
    fileFinderByContentsId,
    localRepositoryRefresher: localRepositoryRefresher,
    fileDeleter,
    fileByPartialSearcher,
    filePathUpdater,
    fileCreator,
    filePathFromAbsolutePathCreator,
    fileSearcher,
  };

  return container;
}
