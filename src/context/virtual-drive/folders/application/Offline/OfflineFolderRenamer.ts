import { FolderPath } from '../../domain/FolderPath';
import { OfflineFolder } from '../../domain/OfflineFolder';
import { InMemoryOfflineFolderRepository } from '../../infrastructure/InMemoryOfflineFolderRepository';

export class OfflineFolderRenamer {
  constructor(private readonly offlineFiles: InMemoryOfflineFolderRepository) {}

  run(folder: OfflineFolder, destination: FolderPath) {
    folder.rename(destination);
    this.offlineFiles.update(folder);
  }
}
