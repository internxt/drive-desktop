import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { logger } from '@/apps/shared/logger/logger';
import { ExtendedDriveFile, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { rename } from 'fs/promises';
import { hasToBeMoved } from './has-to-be-moved';
import VirtualDrive from '@/node-win/virtual-drive';
import { InMemoryFiles } from '../sync-items-by-checkpoint/load-in-memory-paths';

export class FilePlaceholderUpdater {
  constructor(private readonly virtualDrive: VirtualDrive) {}

  async update({ remote, files }: { remote: ExtendedDriveFile; files: InMemoryFiles }) {
    const { path } = remote;

    try {
      const { isValid } = validateWindowsName({ path, name: remote.name });
      if (!isValid) return;

      const remotePath = remote.absolutePath;
      const localPath = files[remote.uuid as FileUuid];

      if (!localPath) {
        this.virtualDrive.createFileByPath({
          itemPath: path,
          itemId: `FILE:${remote.uuid}`,
          size: remote.size,
          creationTime: new Date(remote.createdAt).getTime(),
          lastWriteTime: new Date(remote.updatedAt).getTime(),
        });

        return;
      }

      if (hasToBeMoved({ drive: this.virtualDrive, remotePath, localPath: localPath.path })) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Moving file placeholder',
          remotePath,
          localPath,
        });

        await rename(localPath.path, remotePath);
      }
    } catch (exc) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error updating file placeholder',
        path,
        exc,
      });
    }
  }

  async run({ remotes, files }: { remotes: ExtendedDriveFile[]; files: InMemoryFiles }) {
    const promises = remotes.map((remote) => this.update({ remote, files }));
    await Promise.all(promises);
  }
}
