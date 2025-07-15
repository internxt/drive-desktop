import { RelativePathToAbsoluteConverter } from '@/context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { logger } from '@/apps/shared/logger/logger';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { rename } from 'fs/promises';
import { hasToBeMoved } from './has-to-be-moved';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import VirtualDrive from '@/node-win/virtual-drive';
import { File } from '@/context/virtual-drive/files/domain/File';
import { InMemoryFiles } from '../sync-items-by-checkpoint/load-in-memory-paths';

export class FilePlaceholderUpdater {
  constructor(
    private readonly virtualDrive: VirtualDrive,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
  ) {}

  async update({ remote, files }: { remote: File; files: InMemoryFiles }) {
    const path = remote.path;

    try {
      const { isValid } = validateWindowsName({ path, name: remote.name });
      if (!isValid) return;

      const remotePath = this.relativePathToAbsoluteConverter.run(path) as AbsolutePath;
      const localPath = files[remote.uuid as FileUuid];

      if (!localPath) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Creating file placeholder',
          path,
        });

        this.virtualDrive.createFileByPath({
          relativePath: path,
          itemId: remote.placeholderId,
          size: remote.size,
          creationTime: remote.createdAt.getTime(),
          lastWriteTime: remote.updatedAt.getTime(),
        });

        return;
      }

      if (hasToBeMoved({ drive: this.virtualDrive, remotePath, localPath })) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Moving file placeholder',
          remotePath,
          localPath,
        });

        await rename(localPath, remotePath);
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

  async run({ remotes, files }: { remotes: File[]; files: InMemoryFiles }) {
    const promises = remotes.map((remote) => this.update({ remote, files }));
    await Promise.all(promises);
  }
}
