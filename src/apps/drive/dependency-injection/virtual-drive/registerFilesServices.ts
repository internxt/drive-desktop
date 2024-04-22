import { ContainerBuilder } from 'diod';
import crypt from '../../../../context/shared/infrastructure/crypt';
import { FileCreator } from '../../../../context/virtual-drive/files/application/FileCreator';
import { FileDeleter } from '../../../../context/virtual-drive/files/application/FileDeleter';
import { FilePathUpdater } from '../../../../context/virtual-drive/files/application/FilePathUpdater';
import { FilesByFolderPathSearcher } from '../../../../context/virtual-drive/files/application/FilesByFolderPathSearcher';
import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/FirstsFileSearcher';
import { SameFileWasMoved } from '../../../../context/virtual-drive/files/application/SameFileWasMoved';
import { SingleFileMatchingSearcher } from '../../../../context/virtual-drive/files/application/SingleFileMatchingSearcher';
import { CreateFileOnOfflineFileUploaded } from '../../../../context/virtual-drive/files/application/event-subsribers/CreateFileOnOfflineFileUplodaded';
import { FileOverrider } from '../../../../context/virtual-drive/files/application/override/FileOverrider';
import { FilesSearcherByPartialMatch } from '../../../../context/virtual-drive/files/application/search-all/FilesSearcherByPartialMatch';
import { SyncFileMessenger } from '../../../../context/virtual-drive/files/domain/SyncFileMessenger';
import { LocalFileSystem } from '../../../../context/virtual-drive/files/domain/file-systems/LocalFileSystem';
import { RemoteFileSystem } from '../../../../context/virtual-drive/files/domain/file-systems/RemoteFileSystem';
import { FuseLocalFileSystem } from '../../../../context/virtual-drive/files/infrastructure/FuseLocalFileSystem';
import { SDKRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/SDKRemoteFileSystem';
import { MainProcessSyncFileMessenger } from '../../../../context/virtual-drive/files/infrastructure/SyncFileMessengers/MainProcessSyncFileMessenger';
import { DependencyInjectionMainProcessStorageSdk } from '../../../shared/dependency-injection/main/DependencyInjectionMainProcessStorageSdk';
import { DependencyInjectionMainProcessUserProvider } from '../../../shared/dependency-injection/main/DependencyInjectionMainProcessUserProvider';
import { AuthorizedClients } from '../../../shared/HttpClient/Clients';
import { FileRepository } from '../../../../context/virtual-drive/files/domain/FileRepository';
import { InMemoryFileRepository } from '../../../../context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { FileRepositoryInitializer } from '../../../../context/virtual-drive/files/application/FileRepositoryInitializer';
import { RetrieveAllFiles } from '../../../../context/virtual-drive/files/application/RetrieveAllFiles';

export async function registerFilesServices(
  builder: ContainerBuilder
): Promise<void> {
  // Infra

  builder
    .register(FileRepository)
    .use(InMemoryFileRepository)
    .asSingleton()
    .private();

  const user = DependencyInjectionMainProcessUserProvider.get();
  const sdk = await DependencyInjectionMainProcessStorageSdk.get();

  builder.register(SyncFileMessenger).use(MainProcessSyncFileMessenger);

  builder
    .register(RemoteFileSystem)
    .useFactory(
      (c) =>
        new SDKRemoteFileSystem(
          sdk,
          c.get(AuthorizedClients),
          crypt,
          user.bucket
        )
    );

  builder.register(LocalFileSystem).use(FuseLocalFileSystem);

  // Services

  builder.registerAndUse(FileRepositoryInitializer);

  builder.registerAndUse(RetrieveAllFiles);

  builder.registerAndUse(FirstsFileSearcher);

  builder.registerAndUse(SingleFileMatchingSearcher);

  builder.registerAndUse(FilesByFolderPathSearcher);

  builder.registerAndUse(FilePathUpdater);

  builder.registerAndUse(SameFileWasMoved);

  builder.registerAndUse(FileDeleter);

  builder.registerAndUse(FileCreator);

  builder.registerAndUse(FilesSearcherByPartialMatch);

  builder.registerAndUse(FileOverrider);

  // Event Handlers

  builder
    .registerAndUse(CreateFileOnOfflineFileUploaded)
    .addTag('event-handler');
}
