import Logger from 'electron-log';
import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { FuseCallback } from './FuseCallback';
import { NoSuchFileOrDirectoryError } from './FuseErrors';

type GetAttributesCallbackData = { mode: number; size: number };

export class GetAttributesCallback extends FuseCallback<GetAttributesCallbackData> {
  constructor(
    private readonly virtualDriveContainer: VirtualDriveDependencyContainer,
    private readonly offlineDriveContainer: OfflineDriveDependencyContainer
  ) {
    super();
  }

  async execute(path: string) {
    Logger.debug('GET ATTRIBUTES OF ', path);

    if (path === '/') {
      return this.right({ mode: 16877, size: 0 });
    }

    const file = await this.virtualDriveContainer.filesSearcher.run({ path });

    if (file) {
      return this.right({ mode: 33188, size: file.size });
    }

    const folder = await this.virtualDriveContainer.folderSearcher.run({
      path,
    });

    if (folder) {
      return this.right({ mode: 16877, size: 0 });
    }

    const offlineFile =
      await this.offlineDriveContainer.offlineFileSearcher.run({ path });

    if (offlineFile) {
      return this.right({ mode: 33188, size: offlineFile.size });
    }

    return this.left(
      new NoSuchFileOrDirectoryError(
        `${path} not founded on when it's attributes`
      )
    );
  }
}
