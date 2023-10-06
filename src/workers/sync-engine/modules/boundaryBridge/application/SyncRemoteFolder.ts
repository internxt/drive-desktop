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

  private async renameFolderRecursive(
    currentWin32AbsolutePath: string,
    newWin32AbsolutePath: string
  ) {
    //Ensure it exists
    await fs.stat(currentWin32AbsolutePath);

    await fs.rename(currentWin32AbsolutePath, newWin32AbsolutePath);

    const children = await fs.readdir(newWin32AbsolutePath);

    for (const child of children) {
      const childWin32AbsolutePath = path.win32.join(
        newWin32AbsolutePath,
        child
      );
      const newChildWin32AbsolutePath = path.win32.join(
        newWin32AbsolutePath,
        child
      );

      const stat = await fs.stat(childWin32AbsolutePath);

      if (stat.isDirectory()) {
        await this.renameFolderRecursive(
          childWin32AbsolutePath,
          newChildWin32AbsolutePath
        );
      } else {
        await fs.rename(childWin32AbsolutePath, newChildWin32AbsolutePath);
      }
    }
  }

  private async folderExists(win32AbsolutePath: string): Promise<boolean> {
    try {
      await fs.stat(win32AbsolutePath);
      return true;
    } catch {
      return false;
    }
  }
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
          const exists = await this.folderExists(win32AbsolutePath);
          if (exists) {
            const newWin32AbsolutePath =
              this.relativePathToAbsoluteConverter.run(remote.path.value);
            await this.renameFolderRecursive(
              win32AbsolutePath,
              newWin32AbsolutePath
            );
          }
        } catch (error) {
          Logger.error(error);
        }
      }
    }
  }
}
