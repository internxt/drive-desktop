import { ContainerBuilder } from 'diod';
import { AllParentFoldersStatusIsExists } from '../../../../context/virtual-drive/folders/application/AllParentFoldersStatusIsExists';
import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';
import { FolderCreatorFromOfflineFolder } from '../../../../context/virtual-drive/folders/application/FolderCreatorFromOfflineFolder';
import { FolderDeleter } from '../../../../context/virtual-drive/folders/application/FolderDeleter';
import { FolderMover } from '../../../../context/virtual-drive/folders/application/FolderMover';
import { FolderPathUpdater } from '../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { FolderRenamer } from '../../../../context/virtual-drive/folders/application/FolderRenamer';
import { FolderRepositoryInitializer } from '../../../../context/virtual-drive/folders/application/FolderRepositoryInitializer';
import { FoldersByParentPathLister } from '../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';
import { ParentFolderFinder } from '../../../../context/virtual-drive/folders/application/ParentFolderFinder';
import { SingleFolderMatchingFinder } from '../../../../context/virtual-drive/folders/application/SingleFolderMatchingFinder';
import { SingleFolderMatchingSearcher } from '../../../../context/virtual-drive/folders/application/SingleFolderMatchingSearcher';
import { FuseLocalFileSystem } from '../../../../context/virtual-drive/folders/infrastructure/FuseLocalFileSystem';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/folders/infrastructure/HttpRemoteFileSystem';
import { MainProcessSyncFolderMessenger } from '../../../../context/virtual-drive/folders/infrastructure/SyncMessengers/MainProcessSyncFolderMessenger';
import { SyncFolderMessenger } from '../../../../context/virtual-drive/folders/domain/SyncFolderMessenger';
import { RemoteFileSystem } from '../../../../context/virtual-drive/folders/domain/file-systems/RemoteFileSystem';
import { LocalFileSystem } from '../../../../context/virtual-drive/folders/domain/file-systems/LocalFileSystem';
import { AuthorizedClients } from '../../../shared/HttpClient/Clients';
import { FolderRepository } from '../../../../context/virtual-drive/folders/domain/FolderRepository';
import { InMemoryFolderRepository } from '../../../../context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';

export async function registerFolderServices(
  builder: ContainerBuilder
): Promise<void> {
  // Infra
  builder.register(SyncFolderMessenger).use(MainProcessSyncFolderMessenger);
  // TODO: can be private?

  builder
    .register(FolderRepository)
    .use(InMemoryFolderRepository)
    .asSingleton()
    .private();

  builder
    .register(RemoteFileSystem)
    .useFactory((c) => {
      const clients = c.get(AuthorizedClients);
      return new HttpRemoteFileSystem(
        // @ts-ignore
        clients.drive,
        clients.newDrive
      );
    })
    .private();

  builder.register(LocalFileSystem).use(FuseLocalFileSystem).private();

  // Services
  builder.registerAndUse(FolderRepositoryInitializer);

  builder.registerAndUse(ParentFolderFinder);

  builder.registerAndUse(SingleFolderMatchingFinder);

  builder.registerAndUse(SingleFolderMatchingSearcher);

  builder.registerAndUse(FoldersByParentPathLister);

  builder.registerAndUse(FolderMover);

  builder.registerAndUse(FolderRenamer);

  builder.registerAndUse(FolderPathUpdater);

  builder.registerAndUse(AllParentFoldersStatusIsExists);

  builder.registerAndUse(FolderCreatorFromOfflineFolder);

  builder.registerAndUse(FolderCreator);

  builder.registerAndUse(FolderDeleter);
}
