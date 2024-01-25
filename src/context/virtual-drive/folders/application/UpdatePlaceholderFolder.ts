import { promises as fs, constants as FsConstants } from 'fs';
import { Folder } from '../domain/Folder';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import Logger from 'electron-log';
import path from 'path';
import { FolderStatuses } from '../domain/FolderStatus';
import { FolderRepository } from '../domain/FolderRepository';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';

export class FolderPlaceholderUpdater {
  constructor(
    private readonly repository: FolderRepository,
    private readonly local: LocalFileSystem,
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

  private hasToBeDeleted(local: Folder, remote: Folder) {
    const localExists = local.hasStatus(FolderStatuses.EXISTS);
    const remoteIsTrashed = remote.hasStatus(FolderStatuses.TRASHED);
    const remoteIsDeleted = remote.hasStatus(FolderStatuses.DELETED);
    return localExists && (remoteIsTrashed || remoteIsDeleted);
  }

  private async update(remote: Folder): Promise<void> {
    if (remote.path === path.posix.sep) {
      return;
    }

    const local = this.repository.searchByPartial({
      uuid: remote.uuid,
    });

    if (!local) {
      if (remote.hasStatus(FolderStatuses.EXISTS)) {
        Logger.debug('Creating folder placeholder: ', remote.path);
        await this.repository.add(remote);
        this.local.createPlaceHolder(remote);
      }
      return;
    }

    if (remote.name !== local.name || remote.parentId !== local.parentId) {
      Logger.debug('Updating folder placeholder: ', remote.path);
      await this.repository.update(remote);

      try {
        const stat = await fs.stat(remote.path);
        Logger.debug('Placeholder already exists: ', stat);
        // Do nothing
      } catch {
        const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(
          local.path
        );

        const canBeWritten = this.canWrite(win32AbsolutePath);

        if (!canBeWritten) {
          Logger.warn(`Cannot modify the folder placeholder ${local.path}`);
          return;
        }

        try {
          const exists = await this.folderExists(win32AbsolutePath);
          if (exists) {
            const newWin32AbsolutePath =
              this.relativePathToAbsoluteConverter.run(remote.path);
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

    if (this.hasToBeDeleted(local, remote)) {
      const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(
        local.path
      );
      await fs.rm(win32AbsolutePath, { recursive: true });
      return;
    }
  }

  async run(remotes: Array<Folder>): Promise<void> {
    const updatePromises = remotes.map((remote) => this.update(remote));

    await Promise.all(updatePromises);
  }
}
