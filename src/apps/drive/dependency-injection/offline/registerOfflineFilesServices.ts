import { ContainerBuilder } from 'diod';
import { ClearOfflineFileOnFileCreated } from '../../../../context/offline-drive/files/application/ClearOfflineFileOnFileCreated';
import { OfflineFileCreator } from '../../../../context/offline-drive/files/application/OfflineFileCreator';
import { OfflineFileDeleter } from '../../../../context/offline-drive/files/application/OfflineFileDeleter';
import { OfflineFileFinder } from '../../../../context/offline-drive/files/application/OfflineFileFinder';
import { OfflineFilesByParentPathLister } from '../../../../context/offline-drive/files/application/OfflineFileListerByParentFolder';
import { OfflineFileSearcher } from '../../../../context/offline-drive/files/application/OfflineFileSearcher';
import { OfflineFileSizeIncreaser } from '../../../../context/offline-drive/files/application/OfflineFileSizeIncreaser';
import { TemporalOfflineDeleter } from '../../../../context/offline-drive/files/application/TemporalOfflineDeleter';
import { InMemoryOfflineFileRepository } from '../../../../context/offline-drive/files/infrastructure/InMemoryOfflineFileRepository';
import { OfflineFileRepository } from '../../../../context/offline-drive/files/domain/OfflineFileRepository';

export async function registerOfflineFilesServices(
  builder: ContainerBuilder
): Promise<void> {
  // Infra
  builder
    .register(OfflineFileRepository)
    .use(InMemoryOfflineFileRepository)
    .asSingleton()
    .private();

  // Services
  builder.registerAndUse(OfflineFileSearcher);
  builder.registerAndUse(OfflineFileFinder);
  builder.registerAndUse(OfflineFileSizeIncreaser);
  builder.registerAndUse(OfflineFileCreator);
  builder.registerAndUse(OfflineFileDeleter);
  builder.registerAndUse(OfflineFilesByParentPathLister);
  builder.registerAndUse(TemporalOfflineDeleter);

  // Event Listeners
  builder.registerAndUse(ClearOfflineFileOnFileCreated).addTag('event-handler');
}
