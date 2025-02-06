import { Service } from 'diod';
import { FilePath } from '../../domain/FilePath';
import { FileSize } from '../../domain/FileSize';
import { FileContentsId } from '../../domain/FileContentsId';
import { FileFolderId } from '../../domain/FileFolderId';
import { File } from '../../domain/File';
import { Either, left, right } from '../../../../shared/domain/Either';
import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';
import { SDKRemoteFileSystem } from '../../infrastructure/SDKRemoteFileSystem';

@Service()
export class SimpleFileCreator {
  constructor(private readonly remote: SDKRemoteFileSystem) {}

  async run(
    contentsId: string,
    path: string,
    size: number,
    folderId: number
  ): Promise<Either<DriveDesktopError, File>> {
    const fileSize = new FileSize(size);
    const fileContentsId = new FileContentsId(contentsId);
    const filePath = new FilePath(path);

    const fileFolderId = new FileFolderId(folderId);

    const either = await this.remote.persistv2({
      contentsId: fileContentsId,
      path: filePath,
      size: fileSize,
      folderId: fileFolderId,
    });

    if (either.isLeft()) {
      return left(either.getLeft());
    }

    const dto = either.getRight();

    const file = File.createv2({
      id: dto.id,
      uuid: dto.uuid,
      contentsId: fileContentsId.value,
      folderId: fileFolderId.value,
      createdAt: dto.createdAt,
      modificationTime: dto.modificationTime,
      path: filePath.value,
      size: fileSize.value,
      updatedAt: dto.modificationTime,
    });

    return right(file);
  }
}
