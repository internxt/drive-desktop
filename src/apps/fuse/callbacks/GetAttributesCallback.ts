import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { FuseCallback } from './FuseCallback';
import { NoSuchFileOrDirectoryError } from './FuseErrors';

type GetAttributesCallbackData = {
  mode: number;
  size: number;
  mtime: Date;
  ctime: Date;
  atime?: Date;
};

export class GetAttributesCallback extends FuseCallback<GetAttributesCallbackData> {
  private static readonly FILE = 33188;
  private static readonly FOLDER = 16877;

  constructor(
    private readonly virtualDriveContainer: VirtualDriveDependencyContainer,
    private readonly offlineDriveContainer: OfflineDriveDependencyContainer
  ) {
    super('Get Attributes', { elapsedTime: false, result: false });
  }

  async execute(path: string) {
    if (path === '/') {
      return this.right({
        mode: GetAttributesCallback.FOLDER,
        size: 0,
        mtime: new Date(),
        ctime: new Date(),
        atime: undefined,
      });
    }

    const file = await this.virtualDriveContainer.filesSearcher.run({ path });

    if (file) {
      return this.right({
        mode: GetAttributesCallback.FILE,
        size: file.size,
        ctime: file.createdAt,
        mtime: file.updatedAt,
        atime: new Date(),
      });
    }

    const folder = await this.virtualDriveContainer.folderSearcher.run({
      path,
    });

    if (folder) {
      return this.right({
        mode: GetAttributesCallback.FOLDER,
        size: 0,
        ctime: folder.createdAt,
        mtime: folder.updatedAt,
        atime: folder.createdAt,
      });
    }

    const offlineFile =
      await this.offlineDriveContainer.offlineFileSearcher.run({ path });

    if (offlineFile) {
      return this.right({
        mode: GetAttributesCallback.FILE,
        size: offlineFile.size,
        mtime: new Date(),
        ctime: offlineFile.createdAt,
        atime: offlineFile.createdAt,
      });
    }

    return this.left(
      new NoSuchFileOrDirectoryError(
        `"${path}" not founded on when retrieving it's attributes`
      )
    );
  }
}
