import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { FileStatuses } from '../../../context/virtual-drive/files/domain/FileStatus';
import { Either, right } from '../../../context/shared/domain/Either';
import { FuseError } from './FuseErrors';

type Result = 'no-op' | 'success';

export class UploadOnRename {
  private static readonly NO_OP: Result = 'no-op';
  private static readonly SUCCESS: Result = 'success';
  constructor(
    private readonly offline: OfflineDriveDependencyContainer,
    private readonly virtual: VirtualDriveDependencyContainer
  ) {}

  async run(src: string, dest: string): Promise<Either<FuseError, Result>> {
    const offlineFile = await this.offline.offlineFileSearcher.run({
      path: src,
    });

    const virtualFile = await this.virtual.filesSearcher.run({
      path: dest,
      status: FileStatuses.EXISTS,
    });

    if (!offlineFile || !virtualFile) {
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
