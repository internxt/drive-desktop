import { RelativePathToAbsoluteConverter } from '@/context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { logger } from '@/apps/shared/logger/logger';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { rename } from 'fs/promises';
import { hasToBeMoved } from './has-to-be-moved';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import VirtualDrive from '@/node-win/virtual-drive';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { InMemoryFolders } from '../sync-items-by-checkpoint/load-in-memory-paths';

export class FolderPlaceholderUpdater {
  constructor(
    private readonly virtualDrive: VirtualDrive,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
  ) {}

  async update({ remote, folders }: { remote: Folder; folders: InMemoryFolders }) {
    const path = remote.path;

    try {
      if (path === '/') return;

      const { isValid } = validateWindowsName({ path, name: remote.name });
      if (!isValid) return;

      const remotePath = this.relativePathToAbsoluteConverter.run(path) as AbsolutePath;
      const localPath = folders[remote.uuid as FolderUuid];

      if (!localPath) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Creating folder placeholder',
          path,
        });

        this.virtualDrive.createFolderByPath({
          relativePath: path,
          itemId: remote.placeholderId,
          size: 0,
          creationTime: remote.createdAt.getTime(),
          lastWriteTime: remote.updatedAt.getTime(),
        });

        return;
      }

      if (hasToBeMoved({ remotePath, localPath })) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Moving folder placeholder',
          remotePath,
          localPath,
        });

        await rename(localPath, remotePath);
      }
    } catch (exc) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error updating folder placeholder',
        path,
        exc,
      });
    }
  }

  async run({ remotes, folders }: { remotes: Folder[]; folders: InMemoryFolders }) {
    const promises = remotes.map((remote) => this.update({ remote, folders }));
    await Promise.all(promises);
  }
}
