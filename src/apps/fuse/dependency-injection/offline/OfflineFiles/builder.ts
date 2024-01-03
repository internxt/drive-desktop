import { OfflineFileSearcher } from '../../../../../context/offline-drive/files/application/OfflineFileSearcher';
import { InMemoryOfflineFileRepository } from '../../../../../context/offline-drive/files/infrastructure/InMemoryOfflineFileRepository';
import { OfflineFilesContainer } from './OfflineFilesContainer';
import { OfflineFileFinder } from '../../../../../context/offline-drive/files/application/OfflineFileFinder';
import { OfflineFileSizeIncreaser } from '../../../../../context/offline-drive/files/application/OfflineFileSizeIncreaser';
import { OfflineFileCreator } from '../../../../../context/offline-drive/files/application/OfflineFileCreator';
import { DependencyInjectionEventBus } from '../../common/eventBus';
import { ClearOfflineFileOnFileCreated } from '../../../../../context/offline-drive/files/application/ClearOfflineFileOnFileCreated';
import { OfflineFileDeleter } from '../../../../../context/offline-drive/files/application/OfflineFileDeleter';

export async function buildOfflineFilesContainer(): Promise<OfflineFilesContainer> {
  const { bus: eventBus } = DependencyInjectionEventBus;

  const repository = new InMemoryOfflineFileRepository();

  const offlineFileSearcher = new OfflineFileSearcher(repository);

  const offlineFileFinder = new OfflineFileFinder(offlineFileSearcher);

  const offlineFileSizeIncreaser = new OfflineFileSizeIncreaser(repository);

  const offlineFileCreator = new OfflineFileCreator(repository, eventBus);

  const offlineFileDeleter = new OfflineFileDeleter(repository);

  // Event Listeners
  const clearOfflineFileOnFileCreated = new ClearOfflineFileOnFileCreated(
    offlineFileDeleter
  );

  return {
    offlineFileCreator,
    offlineFileSearcher,
    offlineFileFinder,
    offlineFileSizeIncreaser,
    clearOfflineFileOnFileCreated,
  };
}
