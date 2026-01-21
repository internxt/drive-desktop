import { FileStatuses } from '../../../../context/virtual-drive/files/domain/FileStatus';
import { Either, right } from '../../../../context/shared/domain/Either';
import { FuseError } from './FuseErrors';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { File } from '../../../../context/virtual-drive/files/domain/File';
import { Container } from 'diod';
import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { RelativePathToAbsoluteConverter } from '../../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { TemporalFileUploader } from '../../../../context/storage/TemporalFiles/application/upload/TemporalFileUploader';
import { TemporalFileByPathFinder } from '../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFile } from '../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { TemporalFileByteByByteComparator } from '../../../../context/storage/TemporalFiles/application/comparation/TemporalFileByteByByteComparator';
import { TemporalFilePath } from '../../../../context/storage/TemporalFiles/domain/TemporalFilePath';
import { TemporalFileDeleter } from '../../../../context/storage/TemporalFiles/application/deletion/TemporalFileDeleter';

type Result = 'no-op' | 'success';

export class UploadOnRename {
  private static readonly NO_OP: Result = 'no-op';
  private static readonly SUCCESS: Result = 'success';
  constructor(private readonly container: Container) {}

  private async differs(virtual: File, document: TemporalFile): Promise<boolean> {
    if (virtual.size !== document.size.value) {
      return true;
    }

    try {
      const filePath = this.container.get(RelativePathToAbsoluteConverter).run(virtual.contentsId);

      const areEqual = await this.container
        .get(TemporalFileByteByByteComparator)
        .run(new TemporalFilePath(filePath), document.path);

      logger.debug({ msg: `Contents of <${virtual.path}> did not change` });

      return !areEqual;
    } catch (err) {
      logger.error({ msg: 'Error comparing file contents', error: err });
    }

    return false;
  }

  async run(src: string, dest: string): Promise<Either<FuseError, Result>> {
    const fileToOverride = await this.container.get(FirstsFileSearcher).run({
      path: dest,
      status: FileStatuses.EXISTS,
    });

    if (!fileToOverride) {
      logger.debug({ msg: '[UPLOAD ON RENAME] file to override not found', dest });
      return right(UploadOnRename.NO_OP);
    }

    const document = await this.container.get(TemporalFileByPathFinder).run(src);

    if (!document) {
      logger.debug({ msg: '[UPLOAD ON RENAME] offline file not found', src });
      return right(UploadOnRename.NO_OP);
    }

    const differs = await this.differs(fileToOverride, document);

    if (!differs) {
      await this.container.get(TemporalFileDeleter).run(src);
      return right(UploadOnRename.SUCCESS);
    }

    await this.container.get(TemporalFileUploader).run(document.path.value, {
      contentsId: fileToOverride.contentsId,
      name: fileToOverride.name,
      extension: fileToOverride.type,
    });

    await this.container.get(TemporalFileDeleter).run(src);
    return right(UploadOnRename.SUCCESS);
  }
}
