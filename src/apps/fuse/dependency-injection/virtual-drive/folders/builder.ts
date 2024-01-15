import { AllParentFoldersStatusIsExists } from '../../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderCreator } from '../../../../../context/virtual-drive/folders/application/FolderCreator';
import { FolderDeleter } from '../../../../../context/virtual-drive/folders/application/FolderDeleter';
import { FolderFinder } from '../../../../../context/virtual-drive/folders/application/FolderFinder';
import { FolderMover } from '../../../../../context/virtual-drive/folders/application/FolderMover';
import { FolderPathUpdater } from '../../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderRenamer } from '../../../../../context/virtual-drive/folders/application/FolderRenamer';
import { FolderRepositoryInitiator } from '../../../../../context/virtual-drive/folders/application/FolderRepositoryInitiator';
import { FolderSearcher } from '../../../../../context/virtual-drive/folders/application/FolderSearcher';
import { FoldersByParentPathLister } from '../../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';
import { OfflineFolderCreator } from '../../../../../context/virtual-drive/folders/application/Offline/OfflineFolderCreator';
import { Folder } from '../../../../../context/virtual-drive/folders/domain/Folder';
import { FuseLocalFileSystem } from '../../../../../context/virtual-drive/folders/infrastructure/FuseLocalFileSystem';
import { HttpRemoteFileSystem } from '../../../../../context/virtual-drive/folders/infrastructure/HttpRemoteFileSystem';
import { InMemoryFolderRepository } from '../../../../../context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { InMemoryOfflineFolderRepository } from '../../../../../context/virtual-drive/folders/infrastructure/InMemoryOfflineFolderRepository';
import { MainProcessFolderSyncNotifier } from '../../../../../context/virtual-drive/folders/infrastructure/MainProcessFolderSyncNotifier';
import { DependencyInjectionHttpClientsProvider } from '../../common/clients';
import { DependencyInjectionEventBus } from '../../common/eventBus';

import { FoldersContainer } from './FoldersContainer';

export async function buildFoldersContainer(
  initialFolders: Array<Folder>
): Promise<FoldersContainer> {
  const repository = new InMemoryFolderRepository();
  const clients = DependencyInjectionHttpClientsProvider.get();

  const notifier = new MainProcessFolderSyncNotifier();

  const remoteFileSystem = new HttpRemoteFileSystem(
    // @ts-ignore
    clients.drive,
    clients.newDrive
  );

  const localFileSystem = new FuseLocalFileSystem();

  const { bus: eventBus } = DependencyInjectionEventBus;

  const offlineFolderRepository = new InMemoryOfflineFolderRepository();

  const folderRepositoryInitiator = new FolderRepositoryInitiator(repository);

  await folderRepositoryInitiator.run(initialFolders);

  const folderFinder = new FolderFinder(repository);

  const folderSearcher = new FolderSearcher(repository);

  const foldersByParentPathSearcher = new FoldersByParentPathLister(
    folderFinder,
    repository
  );

  const folderMover = new FolderMover(
    repository,
    remoteFileSystem,
    folderFinder
  );

  const folderRenamer = new FolderRenamer(
    repository,
    remoteFileSystem,
    eventBus,
    notifier
  );

  const folderPathUpdater = new FolderPathUpdater(
    repository,
    folderMover,
    folderRenamer
  );

  const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(
    repository
  );

  const folderCreator = new FolderCreator(
    repository,
    remoteFileSystem,
    eventBus,
    notifier
  );

  const offlineFolderCreator = new OfflineFolderCreator(
    folderFinder,
    offlineFolderRepository,
    repository
  );

  const folderDeleter = new FolderDeleter(
    repository,
    remoteFileSystem,
    localFileSystem,
    allParentFoldersStatusIsExists
  );

  const offline = {
    offlineFolderCreator,
  };

  return {
    folderFinder,
    folderSearcher,
    foldersByParentPathLister: foldersByParentPathSearcher,
    folderPathUpdater,
    allParentFoldersStatusIsExists,
    folderCreator,
    folderDeleter,
    offline,
  };
}
