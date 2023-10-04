import { FolderPath } from '../../domain/FolderPath';
import { OfflineFolder } from '../../domain/OfflineFolder';
import { OfflineFolderRepository } from '../../domain/OfflineFolderRepository';

export class OfflineFolderRenamer {
  constructor(private readonly offlineFiles: OfflineFolderRepository) {}

  run(folder: OfflineFolder, destination: FolderPath) {
    folder.rename(destination);
    this.offlineFiles.update(folder);
  }
}
