import { FileStatuses } from '../../../context/virtual-drive/files/domain/FileStatus';
import { Either, right } from '../../../context/shared/domain/Either';
import { FuseError } from './FuseErrors';
import Logger from 'electron-log';
import { File } from '../../../context/virtual-drive/files/domain/File';
import { OfflineFile } from '../../../context/offline-drive/files/domain/OfflineFile';
import { Container } from 'diod';
import { FirstsFileSearcher } from '../../../context/virtual-drive/files/application/FirstsFileSearcher';
import { RelativePathToAbsoluteConverter } from '../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { OfflineContentsByteByByteComparator } from '../../../context/offline-drive/contents/application/OfflineContentsByteByByteComparator';
import { OfflineContentsUploader } from '../../../context/offline-drive/contents/application/OfflineContentsUploader';
import { OfflineFileSearcher } from '../../../context/offline-drive/files/application/OfflineFileSearcher';

type Result = 'no-op' | 'success';

export class UploadOnRename {
  private static readonly NO_OP: Result = 'no-op';
  private static readonly SUCCESS: Result = 'success';
  constructor(private readonly container: Container) {}

  private async differs(virtual: File, offline: OfflineFile): Promise<boolean> {
    if (virtual.size !== offline.size.value) {
      return true;
    }

    try {
      const filePath = this.container
        .get(RelativePathToAbsoluteConverter)
        .run(virtual.contentsId);

      const areEqual = await this.container
        .get(OfflineContentsByteByByteComparator)
        .run(filePath, offline);

      Logger.info(`Contents of <${virtual.path}> did not change`);

      return !areEqual;
    } catch (err) {
      Logger.error(err);
    }

    return false;
  }

  async run(src: string, dest: string): Promise<Either<FuseError, Result>> {
    const fileToOverride = await this.container.get(FirstsFileSearcher).run({
      path: dest,
      status: FileStatuses.EXISTS,
    });

    if (!fileToOverride) {
      Logger.debug('[UPLOAD ON RENAME] file to override not found', dest);
      return right(UploadOnRename.NO_OP);
    }

    const offlineFile = await this.container.get(OfflineFileSearcher).run({
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

    await this.container
      .get(OfflineContentsUploader)
      .run(offlineFile.id, offlineFile.path, {
        contentsId: fileToOverride.contentsId,
        name: fileToOverride.name,
        extension: fileToOverride.type,
      });

    return right(UploadOnRename.SUCCESS);
  }
}
