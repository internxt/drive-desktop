import { promises as fs, constants as FsConstants } from 'fs';
import Logger from 'electron-log';
import path from 'path';
import * as Sentry from '@sentry/electron/renderer';
import { InMemoryFolderRepository } from '../../infrastructure/InMemoryFolderRepository';
import { NodeWinLocalFolderSystem } from '../../infrastructure/NodeWinLocalFolderSystem';
import { RelativePathToAbsoluteConverter } from '@/context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { Folder } from '../../domain/Folder';
import { FolderStatuses } from '../../domain/FolderStatus';
import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { logger } from '@/apps/shared/logger/logger';
import { SyncState, VirtualDrive } from '@internxt/node-win/dist';

export class FolderPlaceholderUpdater {
  constructor(
    private readonly repository: InMemoryFolderRepository,
    private readonly local: NodeWinLocalFolderSystem,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
    private readonly virtualDrive: VirtualDrive,
  ) {}

  private async renameFolderRecursive(currentWin32AbsolutePath: string, newWin32AbsolutePath: string) {
    //Ensure it exists
    await fs.stat(currentWin32AbsolutePath);

    await fs.rename(currentWin32AbsolutePath, newWin32AbsolutePath);

    const children = await fs.readdir(newWin32AbsolutePath);

    for (const child of children) {
      const childWin32AbsolutePath = path.win32.join(newWin32AbsolutePath, child);
      const newChildWin32AbsolutePath = path.win32.join(newWin32AbsolutePath, child);

      const stat = await fs.stat(childWin32AbsolutePath);

      if (stat.isDirectory()) {
        await this.renameFolderRecursive(childWin32AbsolutePath, newChildWin32AbsolutePath);
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

  private async canWrite(win32AbsolutePath: string) {
    try {
      await fs.access(win32AbsolutePath, FsConstants.R_OK | FsConstants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  private hasToBeDeleted(local: Folder, remote: Folder) {
    const localExists = local.status === FolderStatuses.EXISTS;
    const remoteIsTrashed = remote.status === FolderStatuses.TRASHED;
    const remoteIsDeleted = remote.status === FolderStatuses.DELETED;
    return localExists && (remoteIsTrashed || remoteIsDeleted);
  }

  private async hasToBeCreated(remote: Folder): Promise<boolean> {
    const remoteExists = remote.status === FolderStatuses.EXISTS;

    /**
     * v2.5.3 Daniel Jiménez
     * When we unregister the virtual drive it happens two things:
     * 1. All file placeholders that are OnlineOnly are deleted.
     * 2. All folder placeholders that are OnlineOnly are not deleted but the state becomes NotSync.
     * We need to create the placeholder if the folder does not exist yet (first time)
     * or if it is not synced (everytime we unregister the drive).
     */
    const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(remote.path);
    const existsFolder = await this.folderExists(win32AbsolutePath);

    const { syncState } = this.virtualDrive.getPlaceholderState({ path: remote.path });
    const isSynced = syncState === SyncState.InSync;

    return remoteExists && (!existsFolder || !isSynced);
  }

  async update(remote: Folder): Promise<void> {
    if (remote.path === path.posix.sep) {
      return;
    }

    if (remote.status === FolderStatuses.EXISTS) {
      const { isValid } = validateWindowsName({
        path: remote.path,
        name: remote.name,
      });

      if (!isValid) return;
    }

    const local = this.repository.searchByPartial({
      uuid: remote.uuid,
    });

    if (!local) {
      if (remote.status === FolderStatuses.EXISTS) {
        logger.debug({ msg: 'Creating folder placeholder', path: remote.path });
        this.repository.add(remote);
        this.local.createPlaceHolder(remote);
      }
      return;
    }

    if (remote.name !== local.name || remote.parentId !== local.parentId) {
      Logger.debug('Updating folder placeholder: ', remote.path);
      this.repository.update(remote);

      try {
        const stat = await fs.stat(remote.path);
        Logger.debug('Placeholder already exists: ', stat);
        // Do nothing
      } catch {
        const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(local.path);

        const canBeWritten = await this.canWrite(win32AbsolutePath);

        if (!canBeWritten) {
          Logger.warn(`Cannot modify the folder placeholder ${local.path}`);
          return;
        }

        try {
          const exists = await this.folderExists(win32AbsolutePath);
          if (exists) {
            const newWin32AbsolutePath = this.relativePathToAbsoluteConverter.run(remote.path);
            await this.renameFolderRecursive(win32AbsolutePath, newWin32AbsolutePath);
          }
        } catch (error) {
          Logger.error(error);
          Sentry.captureException(error);
        }
      }
    }

    if (this.hasToBeDeleted(local, remote)) {
      const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(local.path);
      await fs.rm(win32AbsolutePath, { recursive: true });
      return;
    }

    if (await this.hasToBeCreated(remote)) {
      this.local.createPlaceHolder(remote);
      this.repository.update(remote);
    }
  }

  async run(remotes: Array<Folder>): Promise<void> {
    const updatePromises = remotes.map((remote) => this.update(remote));

    await Promise.all(updatePromises);
  }
}
