import { OfflineFileSearcher } from '../../../../../context/offline-drive/files/application/OfflineFileSearcher';
import { InMemoryOfflineFileRepository } from '../../../../../context/offline-drive/files/infrastructure/InMemoryOfflineFileRepository';
import { OfflineFilesContainer } from './OfflineFilesContainer';
import { OfflineFileFinder } from '../../../../../context/offline-drive/files/application/OfflineFileFinder';
import { OfflineFileSizeIncreaser } from '../../../../../context/offline-drive/files/application/OfflineFileSizeIncreaser';

export async function buildOfflineFilesContainer(): Promise<OfflineFilesContainer> {
  const repository = new InMemoryOfflineFileRepository();

  const offlineFileSearcher = new OfflineFileSearcher(repository);

  const offlineFileFinder = new OfflineFileFinder(offlineFileSearcher);

  const offlineFileSizeIncreaser = new OfflineFileSizeIncreaser(repository);

  return {
    offlineFileSearcher,
    offlineFileFinder,
    offlineFileSizeIncreaser,
  };
}
