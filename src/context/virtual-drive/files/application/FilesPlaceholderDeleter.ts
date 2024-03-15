import { FileStatuses } from '../domain/FileStatus';
import { File } from '../domain/File';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import Logger from 'electron-log';
export class FilesPlaceholderDeleter {
  constructor(
    private remoteFileSystem: RemoteFileSystem,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
    private readonly local: LocalFileSystem
  ) {}

  private async hasToBeDeleted(remote: File): Promise<boolean> {
    const fileStatus = await this.remoteFileSystem.checkStatusFile(
      remote['uuid']
    );

    const localUUID = await this.local.getFileIdentity(remote.path);

    Logger.info(
      `localdb path: ${remote.path}\n
      localdb uuid: ${remote['contentsId']}\n
      localStatus: ${remote.status.value}\n
      syncroot uuidd: ${localUUID.split(':')[1]}\n
      syncroot uuidd2: ${localUUID}\n
      remoteo status: ${fileStatus}\n
      trashed condition: ${
        fileStatus === FileStatuses.TRASHED ||
        fileStatus === FileStatuses.DELETED
      }\n
      localUUID condition: ${localUUID.split(':')[1] === remote['contentsId']}\n
      lenuuid: ${localUUID.split(':')[1]?.trim().length}\n
      lenremote: ${remote['contentsId']?.trim().length}\n`
    );
    return (
      (fileStatus === FileStatuses.TRASHED ||
        fileStatus === FileStatuses.DELETED) &&
      localUUID.split(':')[1]?.trim() === remote['contentsId']?.trim()
    );
  }

  private async delete(remote: File): Promise<void> {
    const hasToBeDeleted = await this.hasToBeDeleted(remote);
    Logger.info(`hasToBeDeleted: ${hasToBeDeleted}`);
    if (hasToBeDeleted) {
      Logger.info(`deleting file: ${remote.path}`);
      // const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(
      //   remote.path
      // );
      // Logger.info(`win32AbsolutePath: ${win32AbsolutePath}`);
      await this.local.deleteFileSyncRoot(remote.path);
    }
  }

  async run(remotes: File[]): Promise<void> {
    for (const remote of remotes) {
      await this.delete(remote);
    }
  }
}
