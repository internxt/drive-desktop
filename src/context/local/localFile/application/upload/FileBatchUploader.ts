import { Service } from 'diod';
import { LocalFile } from '../../domain/LocalFile';
import { LocalFileHandler } from '../../domain/LocalFileUploader';
import { SimpleFileCreator } from '../../../../virtual-drive/files/application/create/SimpleFileCreator';
import { RemoteTree } from '../../../../virtual-drive/remoteTree/domain/RemoteTree';
import { relative } from '../../../../../apps/backups/utils/relative';
import { isFatalError } from '../../../../../shared/issues/SyncErrorCause';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { backupErrorsTracker } from '../../../../../backend/features/backup';
import { deleteFileFromStorageByFileId } from '../../../../../infra/drive-server/services/files/services/delete-file-content-from-bucket';

@Service()
export class FileBatchUploader {
  constructor(
    private readonly localHandler: LocalFileHandler,
    private readonly creator: SimpleFileCreator,
    private readonly bucket: string,
  ) {}

  async run(
    localRootPath: string,
    remoteTree: RemoteTree,
    batch: Array<LocalFile>,
    signal: AbortSignal,
  ): Promise<void> {
    for (const localFile of batch) {
      const remotePath = relative(localRootPath, localFile.path);
      const parent = remoteTree.getParent(remotePath);

      let uploadEither;
      try {
        // eslint-disable-next-line no-await-in-loop
        uploadEither = await this.localHandler.upload(localFile.path, localFile.size, signal);
      } catch (error) {
        logger.error({ msg: '[UPLOAD ERROR]', error });
        continue;
      }

      if (uploadEither.isLeft()) {
        const error = uploadEither.getLeft();
        logger.error({ msg: '[FILE UPLOAD FAILED]', error });

        if (isFatalError(error.cause)) {
          throw error;
        }
        backupErrorsTracker.add(parent.id, { name: localFile.nameWithExtension(), error: error.cause });
        continue;
      }

      const contentsId = uploadEither.getRight();

      // eslint-disable-next-line no-await-in-loop
      const either = await this.creator.run(contentsId, localFile.path, localFile.size, parent.id, parent.uuid);

      if (either.isLeft()) {
        logger.debug({ msg: '[FILE CREATION FAILED]', error: either.getLeft() });
        // eslint-disable-next-line no-await-in-loop
        await deleteFileFromStorageByFileId({
          bucketId: this.bucket,
          fileId: contentsId,
        });
        const error = either.getLeft();

        if (error.cause === 'FILE_ALREADY_EXISTS') {
          logger.debug({
            msg: `[FILE ALREADY EXISTS] Skipping file ${localFile.path} - already exists remotely`,
          });
          continue;
        }

        if (error.cause === 'BAD_RESPONSE') {
          backupErrorsTracker.add(parent.id, { name: localFile.nameWithExtension(), error: error.cause });
          continue;
        }

        throw error;
      }

      const file = either.getRight();

      remoteTree.addFile(parent, file);
    }
  }
}
