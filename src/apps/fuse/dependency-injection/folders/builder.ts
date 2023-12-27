import { AllParentFoldersStatusIsExists } from '../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';
import { FolderFinder } from '../../../../context/virtual-drive/folders/application/FolderFinder';
import { FolderMover } from '../../../../context/virtual-drive/folders/application/FolderMover';
import { FolderPathUpdater } from '../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderRenamer } from '../../../../context/virtual-drive/folders/application/FolderRenamer';
import { FolderRepositoryInitiator } from '../../../../context/virtual-drive/folders/application/FolderRepositoryInitiator';
import { FolderSearcher } from '../../../../context/virtual-drive/folders/application/FolderSearcher';
import { FoldersByParentPathSearcher } from '../../../../context/virtual-drive/folders/application/FoldersByParentPathNameLister';
import { OfflineFolderCreator } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderCreator';
import { Folder } from '../../../../context/virtual-drive/folders/domain/Folder';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/folders/infrastructure/HttpRemoteFileSystem';
import { InMemoryFolderRepository } from '../../../../context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { InMemoryOfflineFolderRepository } from '../../../../context/virtual-drive/folders/infrastructure/InMemoryOfflineFolderRepository';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { FoldersContainer } from './FoldersContainer';

export async function buildFoldersContainer(
  initialFolders: Array<Folder>
): Promise<FoldersContainer> {
  const repository = new InMemoryFolderRepository();
  const clients = DependencyInjectionHttpClientsProvider.get();

  const remoteFileSystem = new HttpRemoteFileSystem(
    clients.drive,
    clients.newDrive
  );
  const { bus: eventBus } = DependencyInjectionEventBus;

  const offlineFolderRepository = new InMemoryOfflineFolderRepository();

  const folderRepositoryInitiator = new FolderRepositoryInitiator(repository);

  await folderRepositoryInitiator.run(initialFolders);

  const folderFinder = new FolderFinder(repository);

  const folderSearcher = new FolderSearcher(repository);

  const foldersByParentPathSearcher = new FoldersByParentPathSearcher(
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
    eventBus
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
    eventBus
  );

  const offlineFolderCreator = new OfflineFolderCreator(
    folderFinder,
    offlineFolderRepository,
    repository
  );

  const offline = {
    offlineFolderCreator,
  };

  return {
    folderFinder,
    folderSearcher,
    foldersByParentPathSearcher,
    folderPathUpdater,
    allParentFoldersStatusIsExists,
    folderCreator,
    offline,
  };
}
