import { AllParentFoldersStatusIsExists } from '../../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderCreator } from '../../../../../context/virtual-drive/folders/application/FolderCreator';
import { FolderCreatorFromOfflineFolder } from '../../../../../context/virtual-drive/folders/application/FolderCreatorFromOfflineFolder';
import { FolderDeleter } from '../../../../../context/virtual-drive/folders/application/FolderDeleter';
import { ParentFolderFinder } from '../../../../../context/virtual-drive/folders/application/ParentFolderFinder';
import { FolderMover } from '../../../../../context/virtual-drive/folders/application/FolderMover';
import { FolderPathUpdater } from '../../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderRenamer } from '../../../../../context/virtual-drive/folders/application/FolderRenamer';
import { FolderRepositoryInitializer } from '../../../../../context/virtual-drive/folders/application/FolderRepositoryInitializer';
import { FoldersByParentPathLister } from '../../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';
import { Folder } from '../../../../../context/virtual-drive/folders/domain/Folder';
import { FuseLocalFileSystem } from '../../../../../context/virtual-drive/folders/infrastructure/FuseLocalFileSystem';
import { HttpRemoteFileSystem } from '../../../../../context/virtual-drive/folders/infrastructure/HttpRemoteFileSystem';
import { MainProcessSyncFolderMessenger } from '../../../../../context/virtual-drive/folders/infrastructure/SyncMessengers/MainProcessSyncFolderMessenger';
import { InMemoryFolderRepositorySingleton } from '../../../../shared/dependency-injection/virtual-drive/folders/InMemoryFolderRepositorySingleton';
import { DependencyInjectionHttpClientsProvider } from '../../common/clients';
import { DependencyInjectionEventBus } from '../../common/eventBus';

import { FoldersContainer } from './FoldersContainer';
import { SingleFolderMatchingFinder } from '../../../../../context/virtual-drive/folders/application/SingleFolderMatchingFinder';
import { SingleFolderMatchingSearcher } from '../../../../../context/virtual-drive/folders/application/SingleFolderMatchingSearcher';

export async function buildFoldersContainer(
  initialFolders: Array<Folder>
): Promise<FoldersContainer> {
  const repository = InMemoryFolderRepositorySingleton.instance;
  const clients = DependencyInjectionHttpClientsProvider.get();

  const syncFolderMessenger = new MainProcessSyncFolderMessenger();

  const remoteFileSystem = new HttpRemoteFileSystem(
    // @ts-ignore
    clients.drive,
    clients.newDrive
  );

  const localFileSystem = new FuseLocalFileSystem();

  const { bus: eventBus } = DependencyInjectionEventBus;

  const folderRepositoryInitiator = new FolderRepositoryInitializer(repository);

  await folderRepositoryInitiator.run(initialFolders);

  const parentFolderFinder = new ParentFolderFinder(repository);
  const singleFolderMatchingFinder = new SingleFolderMatchingFinder(repository);
  const singleFolderMatchingSearcher = new SingleFolderMatchingSearcher(
    repository
  );

  const foldersByParentPathSearcher = new FoldersByParentPathLister(
    singleFolderMatchingFinder,
    repository
  );

  const folderMover = new FolderMover(
    repository,
    remoteFileSystem,
    parentFolderFinder
  );

  const folderRenamer = new FolderRenamer(
    repository,
    remoteFileSystem,
    eventBus,
    syncFolderMessenger
  );

  const folderPathUpdater = new FolderPathUpdater(
    repository,
    folderMover,
    folderRenamer
  );

  const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(
    repository
  );

  const folderCreatorFromOfflineFolder = new FolderCreatorFromOfflineFolder(
    repository,
    remoteFileSystem,
    eventBus,
    syncFolderMessenger
  );

  const folderCreator = new FolderCreator(
    repository,
    parentFolderFinder,
    remoteFileSystem,
    eventBus
  );

  const folderDeleter = new FolderDeleter(
    repository,
    remoteFileSystem,
    localFileSystem,
    allParentFoldersStatusIsExists
  );

  return {
    parentFolderFinder,
    foldersByParentPathLister: foldersByParentPathSearcher,
    folderPathUpdater,
    allParentFoldersStatusIsExists,
    folderCreatorFromOfflineFolder,
    folderCreator,
    folderDeleter,
    syncFolderMessenger,
    folderRepositoryInitiator,
    singleFolderMatchingFinder,
    singleFolderMatchingSearcher,
  };
}
