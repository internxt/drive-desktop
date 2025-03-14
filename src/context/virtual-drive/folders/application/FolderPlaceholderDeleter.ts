import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import Logger from 'electron-log';
import { HttpRemoteFolderSystem } from '../infrastructure/HttpRemoteFolderSystem';
import { NodeWinLocalFolderSystem } from '../infrastructure/NodeWinLocalFolderSystem';

export class FolderPlaceholderDeleter {
  constructor(
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
    private readonly remoteFileSystem: HttpRemoteFolderSystem,
    private readonly local: NodeWinLocalFolderSystem,
  ) {}

  private async hasToBeDeleted(remote: Folder): Promise<boolean> {
    if (!remote.path) {
      return false;
    }
    const localUUID = await this.local.getFileIdentity(remote.path);

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
    const hasToBeDeleted = await this.hasToBeDeleted(remote);

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
