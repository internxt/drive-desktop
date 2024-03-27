import { OfflineFile } from '../../../files/domain/OfflineFile';
import { OfflineContentsRepository } from '../../domain/OfflineContentsRepository';
import Logger from 'electron-log';

export class AuxiliarOfflineContentsDeleter {
  constructor(private readonly repository: OfflineContentsRepository) {}

  async run(offlineFile: OfflineFile): Promise<void> {
    await this.repository.remove(offlineFile.id);

    Logger.debug('Temporal file ', offlineFile.id, 'deleted');
  }
}
