import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { FileStatuses } from '../../../context/virtual-drive/files/domain/FileStatus';
import { Either, right } from '../../../context/shared/domain/Either';
import { FuseError } from './FuseErrors';
import Logger from 'electron-log';

type Result = 'no-op' | 'success';

export class UploadOnRename {
  private static readonly NO_OP: Result = 'no-op';
  private static readonly SUCCESS: Result = 'success';
  constructor(
    private readonly offline: OfflineDriveDependencyContainer,
    private readonly virtual: VirtualDriveDependencyContainer
  ) {}

  async run(src: string, dest: string): Promise<Either<FuseError, Result>> {
    const virtualFile = await this.virtual.filesSearcher.run({
      path: dest,
      status: FileStatuses.EXISTS,
    });

    if (!virtualFile) {
      Logger.debug('[UPLOAD ON RENAME] virtual file not found', dest);
      return right(UploadOnRename.NO_OP);
    }

    const offlineFile = await this.offline.offlineFileSearcher.run({
      path: src,
    });

    if (!offlineFile) {
      Logger.debug('[UPLOAD ON RENAME] offline file not found', src);
      return right(UploadOnRename.NO_OP);
    }

    await this.offline.offlineContentsUploader.run(
      offlineFile.id,
      offlineFile.path,
      virtualFile.contentsId
    );

    return right(UploadOnRename.SUCCESS);
  }
}
