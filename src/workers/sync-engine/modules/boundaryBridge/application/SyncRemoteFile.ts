import { File } from '../../files/domain/File';
import fs from 'fs/promises';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { FileByPartialSearcher } from '../../files/application/FileByPartialSearcher';
import { ManagedFileRepository } from '../../files/domain/ManagedFileRepository';
import { PlaceholderCreator } from '../../placeholders/domain/PlaceholderCreator';
import Logger from 'electron-log';

export class SyncRemoteFile {
  constructor(
    private readonly fileByPartialSearcher: FileByPartialSearcher,
    private readonly managedFileRepository: ManagedFileRepository,
    private readonly virtualDrivePlaceholderCreator: PlaceholderCreator,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter
  ) {}

  async run(remote: File): Promise<void> {
    const local = this.fileByPartialSearcher.run({
      contentsId: remote.contentsId,
    });

    if (!local) {
      Logger.debug('Creating file placeholder: ', remote.path.value);
      await this.managedFileRepository.insert(remote);
      this.virtualDrivePlaceholderCreator.file(remote);
      return;
    }

    if (remote.name !== local.name || remote.folderId !== local.folderId) {
      Logger.debug('Updating placeholder: ', remote.path.value);
      await this.managedFileRepository.overwrite(local, remote);
      const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(
        local.path.value
      );
      const newWin32AbsolutePath = this.relativePathToAbsoluteConverter.run(
        remote.path.value
      );
      await fs.rename(win32AbsolutePath, newWin32AbsolutePath);
      // this.virtualDrivePlaceholderCreator.file(remote);
    }
  }
}
