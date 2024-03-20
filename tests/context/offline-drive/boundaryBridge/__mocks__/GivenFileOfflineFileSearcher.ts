import { OfflineFileSearcher } from '../../../../../src/context/offline-drive/files/application/OfflineFileSearcher';
import {
  OfflineFile,
  OfflineFileAttributes,
} from '../../../../../src/context/offline-drive/files/domain/OfflineFile';
import { OfflineFileRepository } from '../../../../../src/context/offline-drive/files/domain/OfflineFileRepository';

export class GivenFileOfflineFileSearcher extends OfflineFileSearcher {
  constructor(private readonly file: OfflineFile) {
    super({} as OfflineFileRepository);
  }

  async run(_partial: Partial<OfflineFileAttributes>) {
    return this.file;
  }
}
