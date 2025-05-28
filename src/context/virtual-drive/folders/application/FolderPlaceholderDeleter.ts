import VirtualDrive from '@/node-win/virtual-drive';
import { Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import Logger from 'electron-log';

export class FolderPlaceholderDeleter {
  constructor(private readonly virtualDrive: VirtualDrive) {}

  private hasToBeDeleted(remote: Folder): boolean {
    if (!remote.path) {
      return false;
    }
    const localUUID = this.virtualDrive.getFileIdentity({ path: remote.path });

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
      this.virtualDrive.deleteFileSyncRoot({ path: remote.path });
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
