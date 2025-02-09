import { RemoteSyncedFolder } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';

export class CreateOrUpdateLocalFolderService {
  async run({ self, remoteFolder }: { self: RemoteSyncManager; remoteFolder: RemoteSyncedFolder }) {
    if (!remoteFolder.id) {
      return;
    }

    await self.db.folders.create({
      ...remoteFolder,
      type: remoteFolder.type ?? 'folder',
      parentId: remoteFolder.parentId ?? undefined,
      bucket: remoteFolder.bucket ?? undefined,
    });
  }
}
