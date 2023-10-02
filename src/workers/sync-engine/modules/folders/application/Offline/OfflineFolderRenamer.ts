import { FolderPath } from '../../domain/FolderPath';
import { OfflineFolder } from '../../domain/OfflineFolder';
import { OfflineFolderRepository } from '../../domain/OfflineFolderRepository';

import Logger from 'electron-log';

export class OfflineFolderRenamer {
  constructor(private readonly offlineFiles: OfflineFolderRepository) {}

  run(folder: OfflineFolder, destination: FolderPath) {
    Logger.debug('RENAME TO ', destination);
    folder.rename(destination);
    this.offlineFiles.update(folder);
  }
}
