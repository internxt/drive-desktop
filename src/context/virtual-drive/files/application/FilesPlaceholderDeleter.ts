import { FileStatuses } from '../domain/FileStatus';
import { File } from '../domain/File';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import Logger from 'electron-log';
import { sleep } from '../../../../apps/main/util';
export class FilesPlaceholderDeleter {
  constructor(
    private remoteFileSystem: RemoteFileSystem,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
    private readonly local: LocalFileSystem
  ) {}

  private async hasToBeDeleted(remote: File): Promise<boolean> {
    const localUUID = await this.local.getFileIdentity(remote.path);

    if (!localUUID) {
      return false;
    }

    sleep(500);
    const fileStatus = await this.remoteFileSystem.checkStatusFile(remote.uuid);

    Logger.info(
      `
      Localdb path: ${remote.path}\n
      ___________\n
      Condition Status: ${
        fileStatus === FileStatuses.TRASHED ||
        fileStatus === FileStatuses.DELETED
      }\n
      Condition ID: ${localUUID.split(':')[1] === remote['contentsId']}\n`
    );
    return (
      (fileStatus === FileStatuses.TRASHED ||
        fileStatus === FileStatuses.DELETED) &&
      localUUID.split(':')[1]?.trim() === remote['contentsId']?.trim()
    );
  }

  private async delete(remote: File): Promise<void> {
    const hasToBeDeleted = await this.hasToBeDeleted(remote);
    if (hasToBeDeleted) {
      await this.local.deleteFileSyncRoot(remote.path);
    }
  }

  async run(remotes: File[]): Promise<void> {
    for (const remote of remotes) {
      await this.delete(remote);
    }
  }
}
