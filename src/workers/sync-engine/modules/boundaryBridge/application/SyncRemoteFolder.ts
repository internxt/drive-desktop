import { promises as fs, constants as FsConstants } from 'fs';
import { FolderByPartialSearcher } from '../../folders/application/FolderByPartialSearcher';
import { Folder } from '../../folders/domain/Folder';
import { ManagedFolderRepository } from '../../folders/domain/ManagedFolderRepository';
import { PlaceholderCreator } from '../../placeholders/domain/PlaceholderCreator';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import Logger from 'electron-log';
import path from 'path';

export class SyncRemoteFolder {
  constructor(
    private readonly folderByPartialSearcher: FolderByPartialSearcher,
    private readonly managedFolderRepository: ManagedFolderRepository,
    private readonly virtualDrivePlaceholderCreator: PlaceholderCreator,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter
  ) {}

  private canWrite(win32AbsolutePath: string) {
    try {
      fs.access(win32AbsolutePath, FsConstants.R_OK | FsConstants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  async run(remote: Folder): Promise<void> {
    if (remote.path.value === path.posix.sep) {
      return;
    }

    const local = this.folderByPartialSearcher.run({
      uuid: remote.uuid,
    });

    if (!local) {
      Logger.debug('Creating folder placeholder: ', remote.path.value);
      await this.managedFolderRepository.insert(remote);
      this.virtualDrivePlaceholderCreator.folder(remote);
      return;
    }

    if (remote.name !== local.name || remote.parentId !== local.parentId) {
      Logger.debug('Updating folder placeholder: ', remote.path.value);
      await this.managedFolderRepository.overwrite(local, remote);

      try {
        const stat = await fs.stat(remote.path.value);
        Logger.debug('Placeholder already exists: ', stat);
        // Do nothing
      } catch {
        const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(
          local.path.value
        );

        const canBeWritten = this.canWrite(win32AbsolutePath);

        if (!canBeWritten) {
          Logger.warn(
            `Cannot modify the folder placeholder ${local.path.value}`
          );
          return;
        }

        try {
          Logger.debug('win32AbsolutePath: ', win32AbsolutePath);
          await fs.unlink(win32AbsolutePath);
          this.virtualDrivePlaceholderCreator.folder(remote);
        } catch (error) {
          Logger.error(error);
        }
      }
    }
  }
}
