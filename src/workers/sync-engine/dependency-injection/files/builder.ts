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
import { FolderFinder } from '../../modules/folders/application/FolderFinder';
import { NodeJsEventBus } from '../../modules/shared/infrastructure/DuplexEventBus';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionLocalRootFolderPath } from '../common/localRootFolderPath';
import { DependencyInjectionTraverserProvider } from '../common/traverser';
import { DependencyInjectionUserProvider } from '../common/user';
import { FilesContainer } from './FilesContainer';

export async function buildFilesContainer({
  folderFinder,
}: {
  folderFinder: FolderFinder;
}): Promise<FilesContainer> {
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
    ipcRendererSyncEngine
  );

  const fileByPartialSearcher = new FileByPartialSearcher(fileRepository);

  const filePathUpdater = new FilePathUpdater(
    fileRepository,
    fileFinderByContentsId,
    folderFinder
  );

  const fileCreator = new FileCreator(
    fileRepository,
    folderFinder,
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
