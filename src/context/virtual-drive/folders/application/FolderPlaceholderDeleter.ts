import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import fs from 'fs/promises';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';

export class FolderPlaceholderDeleter {
  constructor(
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
    private readonly remoteFileSystem: RemoteFileSystem
  ) {}

  private async hasToBeDeleted(remote: Folder): Promise<boolean> {
    const folderStatus = await this.remoteFileSystem.checkStatusFolder(
      remote['uuid']
    );
    return (
      folderStatus === FolderStatuses.TRASHED ||
      folderStatus === FolderStatuses.DELETED
    );
  }

  private async delete(remote: Folder): Promise<void> {
    const hasToBeDeleted = await this.hasToBeDeleted(remote);

    if (hasToBeDeleted) {
      const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(
        remote.path
      );
      await fs.rmdir(win32AbsolutePath);
    }
  }

  async run(remotes: Folder[]): Promise<void> {
    await remotes.map((remote) => this.delete(remote));
  }
}
