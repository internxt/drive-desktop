import { Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import Logger from 'electron-log';
import { NodeWinLocalFolderSystem } from '../infrastructure/NodeWinLocalFolderSystem';

export class FolderPlaceholderDeleter {
  constructor(private readonly local: NodeWinLocalFolderSystem) {}

  private hasToBeDeleted(remote: Folder): boolean {
    if (!remote.path) {
      return false;
    }
    const localUUID = this.local.getFileIdentity(remote.path);

    if (!localUUID) {
      return false;
    }

    if (remote.status !== FolderStatuses.DELETED && remote.status !== FolderStatuses.TRASHED) {
      Logger.info(`Folder ${remote.path} with undefined status, skipping deletion`);
      return false;
    }

    return localUUID.split(':')[1]?.trim() === remote['uuid']?.trim();
  }

  private async delete(remote: Folder): Promise<void> {
    const hasToBeDeleted = this.hasToBeDeleted(remote);

    if (hasToBeDeleted) {
      await this.local.deleteFileSyncRoot(remote.path);
    }
  }

  async run(remotes: Folder[]): Promise<void> {
    await Promise.all(
      remotes.map(async (remote) => {
        await this.delete(remote);
      }),
    );
  }
}
