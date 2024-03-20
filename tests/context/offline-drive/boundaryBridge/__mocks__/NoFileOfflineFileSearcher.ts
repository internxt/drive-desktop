import { OfflineFileSearcher } from '../../../../../src/context/offline-drive/files/application/OfflineFileSearcher';
import { OfflineFileAttributes } from '../../../../../src/context/offline-drive/files/domain/OfflineFile';
import { OfflineFileRepository } from '../../../../../src/context/offline-drive/files/domain/OfflineFileRepository';

export class NoFileOfflineFileSearcher extends OfflineFileSearcher {
  constructor() {
    super({} as OfflineFileRepository);
  }

  async run(_partial: Partial<OfflineFileAttributes>) {
    return undefined;
  }
}
