import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import fs from 'fs/promises';

export class FolderPlaceholderDeleter {
  constructor(
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter
  ) {}

  private hasToBeDeleted(remote: Folder): boolean {
    return (
      remote.status.is(FolderStatuses.TRASHED) ||
      remote.status.is(FolderStatuses.DELETED)
    );
  }

  private async delete(remote: Folder): Promise<void> {
    if (this.hasToBeDeleted(remote)) {
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
