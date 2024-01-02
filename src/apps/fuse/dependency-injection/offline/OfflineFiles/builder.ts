import { OfflineFileSearcher } from '../../../../../context/offline-drive/files/application/OfflineFileSearcher';
import { InMemoryOfflineFileRepository } from '../../../../../context/offline-drive/files/infrastructure/InMemoryOfflineFileRepository';
import { OfflineFilesContainer } from './OfflineFilesContainer';
import { OfflineFileFinder } from '../../../../../context/offline-drive/files/application/OfflineFileFinder';
import { OfflineFileSizeIncreaser } from '../../../../../context/offline-drive/files/application/OfflineFileSizeIncreaser';
import { OfflineFileCreator } from '../../../../../context/offline-drive/files/application/OfflineFileCreator';
import { DependencyInjectionEventBus } from '../../common/eventBus';

export async function buildOfflineFilesContainer(): Promise<OfflineFilesContainer> {
  const { bus: eventBus } = DependencyInjectionEventBus;

  const repository = new InMemoryOfflineFileRepository();

  const offlineFileSearcher = new OfflineFileSearcher(repository);

  const offlineFileFinder = new OfflineFileFinder(offlineFileSearcher);

  const offlineFileSizeIncreaser = new OfflineFileSizeIncreaser(repository);

  const offlineFileCreator = new OfflineFileCreator(repository, eventBus);

  return {
    offlineFileCreator,
    offlineFileSearcher,
    offlineFileFinder,
    offlineFileSizeIncreaser,
  };
}
