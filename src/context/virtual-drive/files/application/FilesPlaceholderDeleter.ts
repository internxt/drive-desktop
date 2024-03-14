import { FileStatuses } from '../domain/FileStatus';
import { File } from '../domain/File';
import fs from 'fs/promises';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';

export class FilesPlaceholderDeleter {
  constructor(
    private remoteFileSystem: RemoteFileSystem,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter
  ) {}

  private async hasToBeDeleted(remote: File): Promise<boolean> {
    const fileStatus = await this.remoteFileSystem.checkStatusFile(
      remote['uuid']
    );
    return (
      fileStatus === FileStatuses.TRASHED || fileStatus === FileStatuses.DELETED
    );
  }

  private async delete(remote: File): Promise<void> {
    const hasToBeDeleted = await this.hasToBeDeleted(remote);
    if (hasToBeDeleted) {
      const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(
        remote.path
      );
      await fs.unlink(win32AbsolutePath);
    }
  }

  async run(remotes: File[]): Promise<void> {
    await remotes.map((remote) => this.delete(remote));
  }
}
