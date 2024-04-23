import { ContainerBuilder } from 'diod';
import crypt from '../../../../context/shared/infrastructure/crypt';
import { FileCreator } from '../../../../context/virtual-drive/files/application/create/FileCreator';
import { FileTrasher } from '../../../../context/virtual-drive/files/application/trash/FileTrasher';
import { FilePathUpdater } from '../../../../context/virtual-drive/files/application/move/FilePathUpdater';
import { FilesByFolderPathSearcher } from '../../../../context/virtual-drive/files/application/search/FilesByFolderPathSearcher';
import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { SingleFileMatchingSearcher } from '../../../../context/virtual-drive/files/application/search/SingleFileMatchingSearcher';
import { CreateFileOnTemporalFileUploaded } from '../../../../context/virtual-drive/files/application/create/CreateFileOnTemporalFileUploaded';
import { FileOverrider } from '../../../../context/virtual-drive/files/application/override/FileOverrider';
import { FilesSearcherByPartialMatch } from '../../../../context/virtual-drive/files/application/search-all/FilesSearcherByPartialMatch';
import { SyncFileMessenger } from '../../../../context/virtual-drive/files/domain/SyncFileMessenger';
import { RemoteFileSystem } from '../../../../context/virtual-drive/files/domain/file-systems/RemoteFileSystem';
import { SDKRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/SDKRemoteFileSystem';
import { MainProcessSyncFileMessenger } from '../../../../context/virtual-drive/files/infrastructure/SyncFileMessengers/MainProcessSyncFileMessenger';
import { DependencyInjectionMainProcessStorageSdk } from '../../../shared/dependency-injection/main/DependencyInjectionMainProcessStorageSdk';
import { DependencyInjectionMainProcessUserProvider } from '../../../shared/dependency-injection/main/DependencyInjectionMainProcessUserProvider';
import { AuthorizedClients } from '../../../shared/HttpClient/Clients';
import { FileRepository } from '../../../../context/virtual-drive/files/domain/FileRepository';
import { InMemoryFileRepository } from '../../../../context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { FileRepositoryInitializer } from '../../../../context/virtual-drive/files/application/FileRepositoryInitializer';
import { RetrieveAllFiles } from '../../../../context/virtual-drive/files/application/RetrieveAllFiles';
import { FileDownloader } from '../../../../context/virtual-drive/files/application/download/FileDownloader';
import { FileDownloaderHandlerFactory } from '../../../../context/virtual-drive/files/domain/download/FileDownloaderHandlerFactory';
import { EnvironmentFileDownloaderHandlerFactory } from '../../../../context/virtual-drive/files/infrastructure/download/EnvironmentRemoteFileContentsManagersFactory';
import { Environment } from '@internxt/inxt-js';

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

  builder
    .register(FileDownloaderHandlerFactory)
    .useFactory(
      (c) =>
        new EnvironmentFileDownloaderHandlerFactory(
          c.get(Environment),
          user.bucket
        )
    );

  // Services

  builder.registerAndUse(FileRepositoryInitializer);

  builder.registerAndUse(RetrieveAllFiles);

  builder.registerAndUse(FirstsFileSearcher);

  builder.registerAndUse(SingleFileMatchingSearcher);

  builder.registerAndUse(FilesByFolderPathSearcher);

  builder.registerAndUse(FilePathUpdater);

  builder.registerAndUse(FileTrasher);

  builder.registerAndUse(FileCreator);

  builder.registerAndUse(FilesSearcherByPartialMatch);

  builder.registerAndUse(FileOverrider);

  builder.registerAndUse(FileDownloader);

  // Event Handlers
  builder
    .registerAndUse(CreateFileOnTemporalFileUploaded)
    .addTag('event-handler');
}
