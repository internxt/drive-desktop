import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { FileStatuses } from '../../../context/virtual-drive/files/domain/FileStatus';
import { Either, right } from '../../../context/shared/domain/Either';
import { FuseError } from './FuseErrors';
import Logger from 'electron-log';
import { File } from '../../../context/virtual-drive/files/domain/File';
import { OfflineFile } from '../../../context/offline-drive/files/domain/OfflineFile';

type Result = 'no-op' | 'success';

export class UploadOnRename {
  private static readonly NO_OP: Result = 'no-op';
  private static readonly SUCCESS: Result = 'success';
  constructor(
    private readonly offline: OfflineDriveDependencyContainer,
    private readonly virtual: VirtualDriveDependencyContainer
  ) {}

  private async differs(virtual: File, offline: OfflineFile): Promise<boolean> {
    if (virtual.size !== offline.size.value) {
      return true;
    }

    try {
      const filePath = this.virtual.relativePathToAbsoluteConverter.run(
        virtual.contentsId
      );

      const areEqual =
        await this.offline.offlineContentsByteByByteComparator.run(
          filePath,
          offline
        );

      Logger.info(`Contents of <${virtual.path}> did not change`);

      return !areEqual;
    } catch (err) {
      Logger.error(err);
    }

    return false;
  }

  async run(src: string, dest: string): Promise<Either<FuseError, Result>> {
    const fileToOverride = await this.virtual.filesSearcher.run({
      path: dest,
      status: FileStatuses.EXISTS,
    });

    if (!fileToOverride) {
      Logger.debug('[UPLOAD ON RENAME] file to override not found', dest);
      return right(UploadOnRename.NO_OP);
    }

    const offlineFile = await this.offline.offlineFileSearcher.run({
      path: src,
    });

    if (!offlineFile) {
      Logger.debug('[UPLOAD ON RENAME] offline file not found', src);
      return right(UploadOnRename.NO_OP);
    }

    const differs = await this.differs(fileToOverride, offlineFile);

    if (!differs) {
      return right(UploadOnRename.SUCCESS);
    }

    await this.offline.offlineContentsUploader.run(
      offlineFile.id,
      offlineFile.path,
      fileToOverride.contentsId
    );

    return right(UploadOnRename.SUCCESS);
  }
}
