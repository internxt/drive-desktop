/* eslint-disable no-await-in-loop */
import { Service } from 'diod';
import { LocalFile } from '../../domain/LocalFile';
import { LocalFileHandler } from '../../domain/LocalFileUploader';
import { SimpleFileCreator } from '../../../../virtual-drive/files/application/create/SimpleFileCreator';
import { RemoteTree } from '../../../../virtual-drive/remoteTree/domain/RemoteTree';
import { relativeV2 } from '../../../../../apps/backups/utils/relative';
import { LocalFileMessenger } from '../../domain/LocalFileMessenger';
import { isFatalError } from '../../../../../apps/shared/issues/SyncErrorCause';
import Logger from 'electron-log';
import { ipcRenderer } from 'electron';

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
      try {
        // eslint-disable-next-line no-await-in-loop
        const uploadEither = await this.localHandler.upload(
          localFile.path,
          localFile.size,
          signal
        );
        Logger.info(localFile.path);

        if (uploadEither.isLeft()) {
          const error = uploadEither.getLeft();

          Logger.error(
            '[Local File Uploader] Error uploading file',
            localFile.path,
            error
          );

          if (isFatalError(error.cause)) {
            throw error;
          }

          // eslint-disable-next-line no-await-in-loop
          await this.messenger.creationFailed(localFile, error);
          continue;
        }

        const contentsId = uploadEither.getRight();

        Logger.info('[Local File Uploader] Uploading file', localRootPath);

        Logger.info(
          '[Local File Uploader] Uploading file',
          localFile.path,
          'to',
          contentsId
        );

        const remotePath = relativeV2(localRootPath, localFile.path);

        Logger.info('Uploading file', localFile.path, 'to', remotePath);

        const parent = remoteTree.getParent(remotePath);

        Logger.info('Uploading file', localFile.path, 'to', parent.path);

        // eslint-disable-next-line no-await-in-loop
        const either = await this.creator.run(
          contentsId,
          remotePath,
          localFile.size,
          parent.id
        );

        if (either.isLeft()) {
          // eslint-disable-next-line no-await-in-loop
          await this.localHandler.delete(contentsId);
          const error = either.getLeft();

          if (error.cause === 'FILE_ALREADY_EXISTS') {
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

        Logger.info('[File created]', file);

        await ipcRenderer.send('FILE_CREATED', {
          name: file.name,
          extension: file.type,
          nameWithExtension: file.nameWithExtension,
          fileId: file.id,
          path: localFile.path,
        });

        remoteTree.addFile(parent, file);
      } catch (error: any) {
        Logger.error(
          '[Local File Uploader] Error uploading file',
          localFile.path,
          error
        );

        if (isFatalError(error.cause)) {
          throw error;
        }

        // eslint-disable-next-line no-await-in-loop
        await this.messenger.creationFailed(localFile, error);
        continue;
      }
    }
  }
}
