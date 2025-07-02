import { Stats } from 'fs';

import { Watcher } from '../watcher';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { isTemporaryFile } from '@/apps/utils/isTemporalFile';
// import { isFileMoved } from './is-file-moved';

type TProps = {
  self: Watcher;
  absolutePath: AbsolutePath;
  stats: Stats;
};

export async function onAdd({ self, absolutePath, stats }: TProps) {
  const path = pathUtils.absoluteToRelative({
    base: self.virtualDrive.syncRootPath as AbsolutePath,
    path: absolutePath,
  });

  try {
    const { size, birthtime, mtime } = stats;

    if (size === 0 || size > BucketEntry.MAX_SIZE) {
      /**
       * v2.5.6 Daniel Jiménez
       * TODO: add sync issue
       */
      self.logger.warn({ msg: 'Invalid file size', path, size });
      return;
    }

    const tempFile = isTemporaryFile(path);

    if (tempFile) {
      self.logger.debug({ msg: 'File is temporary, skipping', path });
      return;
    }

    const { data: uuid } = NodeWin.getFileUuid({ drive: self.virtualDrive, path });

    if (!uuid) {
      self.logger.debug({ msg: 'File added', path });
      self.fileInDevice.add(absolutePath);
      await self.callbacks.addController.execute({
        path,
        virtualDrive: self.virtualDrive,
        isFolder: false,
      });
      return;
    }

    const creationTime = new Date(birthtime).getTime();
    const modificationTime = new Date(mtime).getTime();

    if (creationTime === modificationTime) {
      /* File added from remote */
    } else {
      // await isFileMoved({ self, path, uuid });
    }
  } catch (error) {
    self.logger.error({ msg: 'Error onAdd', path, error });
  }
}
