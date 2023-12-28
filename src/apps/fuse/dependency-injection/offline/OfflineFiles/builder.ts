import { CreateOfflineFile } from '../../../../../context/offline-drive/files/application/CreateOfflineFile';
import { OfflineFileSearcher } from '../../../../../context/offline-drive/files/application/OfflineFileSearcher';
import { WriteToOfflineFile } from '../../../../../context/offline-drive/files/application/WriteToOfflineFile';
import { FSOfflineFileFileSystem } from '../../../../../context/offline-drive/files/infrastructure/FSOfflineFileFileSystem';
import { InMemoryOfflineFileRepository } from '../../../../../context/offline-drive/files/infrastructure/InMemoryOfflineFileRepository';
import { FuseAppDataLocalFileContentsDirectoryProvider } from '../../../../../context/virtual-drive/shared/infrastructure/LocalFileContentsDirectoryProviders/FuseAppDataLocalFileContentsDirectoryProvider';
import { DependencyInjectionEventBus } from '../../common/eventBus';
import { OfflineFilesContainer } from './OfflineFilesContainer';

export async function buildOfflineFilesContainer(): Promise<OfflineFilesContainer> {
  const { bus: eventBus } = DependencyInjectionEventBus;
  const repository = new InMemoryOfflineFileRepository();

  const localFileContentsDirectoryProvider =
    new FuseAppDataLocalFileContentsDirectoryProvider();
  const fileSystem = new FSOfflineFileFileSystem(
    localFileContentsDirectoryProvider,
    'uploads'
  );

  await fileSystem.init();

  const createOfflineFile = new CreateOfflineFile(
    repository,
    fileSystem,
    eventBus
  );

  const offlineFileSearcher = new OfflineFileSearcher(repository);

  const writeToOfflineFile = new WriteToOfflineFile(repository, fileSystem);

  return {
    createOfflineFile,
    offlineFileSearcher,
    writeToOfflineFile,
  };
}
