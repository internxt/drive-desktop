import { RelativePathToAbsoluteConverter } from '@/context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { logger } from '@/apps/shared/logger/logger';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { rename } from 'fs/promises';
import { hasToBeMoved } from './has-to-be-moved';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import VirtualDrive from '@/node-win/virtual-drive';
import { File } from '@/context/virtual-drive/files/domain/File';
import { InMemoryFiles } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { updateContentsId } from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';

export class FilePlaceholderUpdater {
  constructor(
    private readonly virtualDrive: VirtualDrive,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
    private readonly fileContentsUploader: ContentsUploader,
  ) {}

  async update({ remote, files }: { remote: File; files: InMemoryFiles }) {
    const { path } = remote;

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

      if (hasToBeMoved({ drive: this.virtualDrive, remotePath, localPath: localPath.path })) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Moving file placeholder',
          remotePath,
          localPath,
        });

        await rename(localPath.path, remotePath);
      }

      const remoteTime = Math.floor(remote.modificationTime.getTime() / 1000);
      const localTime = Math.floor(localPath.stats.mtime.getTime() / 1000);
      if (localTime > remoteTime) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'File placeholder has been modified locally, updating remote',
          remotePath,
          uuid: remote.uuid,
          remoteDate: remote.modificationTime.toISOString(),
          localDate: localPath.stats.mtime.toISOString(),
        });

        await updateContentsId({
          virtualDrive: this.virtualDrive,
          stats: localPath.stats,
          path: createRelativePath(remote.path),
          uuid: remote.uuid as string,
          fileContentsUploader: this.fileContentsUploader,
        });
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
