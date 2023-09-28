import { CreateFilePlaceholderEmitter } from 'workers/sync-engine/modules/files/application/CreateFilePlaceholderEmitter';
import { CreateFilePlaceholderOnDeletionFailed } from 'workers/sync-engine/modules/files/application/CreateFilePlaceholderOnDeletionFailed';
import { FilePlaceholderCreatorFromContentsId } from 'workers/sync-engine/modules/files/application/FilePlaceholderCreatorFromContentsId';
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
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { DependencyInjectionLocalRootFolderPath } from '../common/localRootFolderPath';
import { DependencyInjectionTraverserProvider } from '../common/traverser';
import { DependencyInjectionUserProvider } from '../common/user';
import { FoldersContainer } from '../folders/FoldersContainer';
import { PlaceholderContainer } from '../placeholders/PlaceholdersContainer';
import { FilesContainer } from './FilesContainer';

export async function buildFilesContainer(
  folderContainer: FoldersContainer,
  placeholderContainer: PlaceholderContainer
): Promise<{
  container: FilesContainer;
  subscribers: any;
}> {
  const clients = DependencyInjectionHttpClientsProvider.get();
  const traverser = DependencyInjectionTraverserProvider.get();
  const user = DependencyInjectionUserProvider.get();
  const localRootFolderPath = DependencyInjectionLocalRootFolderPath.get();
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

  const filePathUpdater = new FilePathUpdater(
    fileRepository,
    fileFinderByContentsId,
    folderContainer.folderFinder,
    ipcRendererSyncEngine
  );

  const fileCreator = new FileCreator(
    fileRepository,
    folderContainer.folderFinder,
    fileDeleter,
    eventBus
  );

  const filePathFromAbsolutePathCreator = new FilePathFromAbsolutePathCreator(
    localRootFolderPath
  );

  const fileSearcher = new FileSearcher(fileRepository);

  const createFilePlaceholderEmitter = new CreateFilePlaceholderEmitter(
    eventBus
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

  const container: FilesContainer = {
    fileFinderByContentsId,
    localRepositoryRefresher: localRepositoryRefresher,
    fileDeleter,
    fileByPartialSearcher,
    filePathUpdater,
    fileCreator,
    filePathFromAbsolutePathCreator,
    fileSearcher,
    createFilePlaceholderEmitter: createFilePlaceholderEmitter,
    filePlaceholderCreatorFromContentsId: filePlaceholderCreatorFromContentsId,
    createFilePlaceholderOnDeletionFailed:
      createFilePlaceholderOnDeletionFailed,
  };

  return { container, subscribers: [] };
}
