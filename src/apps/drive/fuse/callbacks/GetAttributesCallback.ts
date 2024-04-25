import { Container } from 'diod';
import { Either, left } from '../../../../context/shared/domain/Either';
import { FileStatuses } from '../../../../context/virtual-drive/files/domain/FileStatus';
import { FuseCallback } from './FuseCallback';
import { FuseError, FuseNoSuchFileOrDirectoryError } from './FuseErrors';
import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { SingleFolderMatchingSearcher } from '../../../../context/virtual-drive/folders/application/SingleFolderMatchingSearcher';
import { TemporalFileByPathFinder } from '../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';

type GetAttributesCallbackData = {
  mode: number;
  size: number;
  mtime: Date;
  ctime: Date;
  atime?: Date;
  uid: number;
  gid: number;
};

export class GetAttributesCallback extends FuseCallback<GetAttributesCallbackData> {
  private static readonly FILE = 33188;
  private static readonly FOLDER = 16877;

  constructor(private readonly container: Container) {
    super('Get Attributes');
  }

  protected left(
    error: FuseNoSuchFileOrDirectoryError
  ): Either<FuseError, GetAttributesCallbackData> {
    // When the OS wants to check if a node exists will try to get the attributes of it
    // so not founding them is not an error
    return left(error);
  }

  async execute(path: string) {
    if (path === '/') {
      return this.right({
        mode: GetAttributesCallback.FOLDER,
        size: 0,
        mtime: new Date(),
        ctime: new Date(),
        atime: undefined,
        uid: process.getuid(),
        gid: process.getgid(),
      });
    }

    const file = await this.container.get(FirstsFileSearcher).run({
      path,
      status: FileStatuses.EXISTS,
    });

    if (file) {
      return this.right({
        mode: GetAttributesCallback.FILE,
        size: file.size,
        ctime: file.createdAt,
        mtime: file.updatedAt,
        atime: new Date(),
        uid: process.getuid(),
        gid: process.getgid(),
      });
    }

    const folder = await this.container.get(SingleFolderMatchingSearcher).run({
      path,
    });

    if (folder) {
      return this.right({
        mode: GetAttributesCallback.FOLDER,
        size: 0,
        ctime: folder.createdAt,
        mtime: folder.updatedAt,
        atime: folder.createdAt,
        uid: process.getuid(),
        gid: process.getgid(),
      });
    }

    const document = await this.container
      .get(TemporalFileByPathFinder)
      .run(path);

    if (document) {
      return this.right({
        mode: GetAttributesCallback.FILE,
        size: document.size.value,
        mtime: new Date(),
        ctime: document.createdAt,
        atime: document.createdAt,
        uid: process.getuid(),
        gid: process.getgid(),
      });
    }

    return this.left(new FuseNoSuchFileOrDirectoryError(path));
  }
}
