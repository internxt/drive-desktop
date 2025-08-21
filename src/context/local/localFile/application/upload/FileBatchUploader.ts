import { Service } from 'diod';
import { LocalFile } from '../../domain/LocalFile';
import { LocalFileHandler } from '../../domain/LocalFileUploader';
import { SimpleFileCreator } from '../../../../virtual-drive/files/application/create/SimpleFileCreator';
import { RemoteTree } from '../../../../virtual-drive/remoteTree/domain/RemoteTree';
import { relative } from '../../../../../apps/backups/utils/relative';
import { LocalFileMessenger } from '../../domain/LocalFileMessenger';
import { isFatalError } from '../../../../../shared/issues/SyncErrorCause';
import Logger from 'electron-log';

@Service()
export class FileBatchUploader {
  constructor(
    private readonly localHandler: LocalFileHandler,
    private readonly creator: SimpleFileCreator,
    protected readonly messenger: LocalFileMessenger
  ) {}

  async run(
    localRootPath: string,
    remoteTree: RemoteTree,
    batch: Array<LocalFile>,
    signal: AbortSignal
  ): Promise<void> {
    for (const localFile of batch) {
      let uploadEither;
      try {
        // eslint-disable-next-line no-await-in-loop
        uploadEither = await this.localHandler.upload(
          localFile.path,
          localFile.size,
          signal
        );
      } catch (error) {
        Logger.error('[UPLOAD ERROR]', error);
        continue;
      }

      if (uploadEither.isLeft()) {
        const error = uploadEither.getLeft();
        Logger.error('[FILE UPLOAD FAILED]', error);

        if (isFatalError(error.cause)) {
          throw error;
        }

        // eslint-disable-next-line no-await-in-loop
        await this.messenger.creationFailed(localFile, error);
        continue;
      }

      const contentsId = uploadEither.getRight();

      const remotePath = relative(localRootPath, localFile.path);

      const parent = remoteTree.getParent(remotePath);

      // eslint-disable-next-line no-await-in-loop
      const either = await this.creator.run(
        contentsId,
        localFile.path,
        localFile.size,
        parent.id,
        parent.uuid
      );

      if (either.isLeft()) {
        Logger.debug('[FILE CREATION FAILED]', either.getLeft());
        // eslint-disable-next-line no-await-in-loop
        await this.localHandler.delete(contentsId);
        const error = either.getLeft();

        if (error.cause === 'FILE_ALREADY_EXISTS') {
          Logger.debug(
            `[FILE ALREADY EXISTS] Skipping file ${localFile.path} - already exists remotely`
          );
          continue;
        }

        if (error.cause === 'BAD_RESPONSE') {
          // eslint-disable-next-line no-await-in-loop
          await this.messenger.creationFailed(localFile, error);
          continue;
        }

        throw error;
      }

      const file = either.getRight();

      remoteTree.addFile(parent, file);
    }
  }
}
