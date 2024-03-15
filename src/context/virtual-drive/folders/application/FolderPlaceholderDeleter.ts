import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import fs from 'fs/promises';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import Logger from 'electron-log';
import { sleep } from '../../../../apps/main/util';
import fs from 'fs/promises';

export class FolderPlaceholderDeleter {
  constructor(
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
    private readonly remoteFileSystem: RemoteFileSystem,
    private readonly local: LocalFileSystem
  ) {}

  private async hasToBeDeleted(remote: Folder): Promise<boolean> {
    Logger.info(`remote path in hastobedeleted: ${remote.path}`);
    const localUUID = await this.local.getFileIdentity(remote.path);
    Logger.info(`localUUID in hastobedeleted: ${localUUID}`);
    if (!localUUID) {
      return false;
    }

    sleep(500);
    const folderStatus = await this.remoteFileSystem.checkStatusFolder(
      remote['uuid']
    );

    Logger.info(
      `localdb path: ${remote.path}\n
      localdb uuid: ${remote['uuid']}\n
      localStatus: ${remote.status.value}\n
      syncroot uuidd: ${localUUID.split(':')[1]}\n
      syncroot uuidd2: ${localUUID}\n
      remoteo status: ${folderStatus}\n
      trashed condition: ${
        folderStatus === FolderStatuses.TRASHED ||
        folderStatus === FolderStatuses.DELETED
      }\n
        localUUID condition: ${localUUID.split(':')[1] === remote['uuid']}\n
        lenuuid: ${localUUID.split(':')[1]?.trim().length}\n
        lenremote: ${remote['uuid']?.trim().length}\n`
    );

    return (
      (folderStatus === FolderStatuses.TRASHED ||
        folderStatus === FolderStatuses.DELETED) &&
      localUUID.split(':')[1]?.trim() === remote['uuid']?.trim()
    );
  }

  private async delete(remote: Folder): Promise<void> {
    const hasToBeDeleted = await this.hasToBeDeleted(remote);

    if (hasToBeDeleted) {
      const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(
        remote.path
      );
      Logger.info(`win32AbsolutePath in delete: ${win32AbsolutePath}`);
      //await fs.rm(win32AbsolutePath, { recursive: true, force: true });
      await this.local.deleteFileSyncRoot(remote.path);
    }
  }

  async run(remotes: Folder[]): Promise<void> {
    for (const remote of remotes) {
      await this.delete(remote);
    }
  }
}
