import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { Callback } from './Callback';
import Logger from 'electron-log';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class GetAttributes {
  constructor(
    private readonly virtualDriveContainer: VirtualDriveDependencyContainer,
    private readonly offlineDriveContainer: OfflineDriveDependencyContainer
  ) {}

  async execute(path: string, cb: Callback): Promise<void> {
    Logger.debug('GET ATTRIBUTES OF ', path);

    if (path === '/') {
      return cb(0, { mode: 16877, size: 0 });
    }

    const file = await this.virtualDriveContainer.filesSearcher.run({ path });

    if (file) {
      return cb(0, { mode: 33188, size: file.size });
    }

    const folder = await this.virtualDriveContainer.folderSearcher.run({
      path,
    });

    if (folder) {
      return cb(0, { mode: 16877, size: 0 });
    }

    const offlineFile =
      await this.offlineDriveContainer.offlineFileSearcher.run({ path });

    if (offlineFile) {
      return cb(0, { mode: 33188, size: offlineFile.size });
    }

    cb(fuse.ENOENT);
  }
}
