import { RemoteSyncedFile } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';

export class CreateOrUpdateLocalFileService {
  async run({ self, remoteFile }: { self: RemoteSyncManager; remoteFile: RemoteSyncedFile }) {
    if (!remoteFile.folderId) {
      return;
    }

    await self.db.files.create(remoteFile);
  }
}
