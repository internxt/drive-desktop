import { FileStatuses } from '../domain/FileStatus';
import { File } from '../domain/File';
import fs from 'fs/promises';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';

export class FilesPlaceholderDeleter {
  constructor(
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter
  ) {}

  private hasToBeDeleted(remote: File): boolean {
    return (
      remote.status.is(FileStatuses.TRASHED) ||
      remote.status.is(FileStatuses.DELETED)
    );
  }

  private async delete(remote: File): Promise<void> {
    if (this.hasToBeDeleted(remote)) {
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
