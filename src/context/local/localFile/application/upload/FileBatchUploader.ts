/* eslint-disable @typescript-eslint/no-explicit-any */
import { Service } from 'diod';
import { LocalFile } from '../../domain/LocalFile';
import { SimpleFileCreator } from '../../../../virtual-drive/files/application/create/SimpleFileCreator';
import { isFatalError } from '../../../../../apps/shared/issues/SyncErrorCause';
import Logger from 'electron-log';
import { EnvironmentLocalFileUploader } from '../../infrastructure/EnvironmentLocalFileUploader';
import { logger } from '@/apps/shared/logger/logger';
import { onFileCreated } from '@/apps/main/fordwardToWindows';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { RemoteTree } from '@/apps/backups/remote-tree/traverser';
import { dirname } from 'path';
import { RelativePath } from '../../infrastructure/AbsolutePath';

@Service()
export class FileBatchUploader {
  constructor(
    private readonly localHandler: EnvironmentLocalFileUploader,
    private readonly creator: SimpleFileCreator,
  ) {}

  async run(
    context: BackupsContext,
    localRootPath: string,
    remoteTree: RemoteTree,
    batch: Array<LocalFile>,
    updateProgress: () => void,
  ): Promise<void> {
    const MAX_CONCURRENT_TASKS = 5;

    const chunks = Array.from({ length: Math.ceil(batch.length / MAX_CONCURRENT_TASKS) }, (_, i) =>
      batch.slice(i * MAX_CONCURRENT_TASKS, (i + 1) * MAX_CONCURRENT_TASKS),
    );

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (localFile) => {
          try {
            const uploadEither = await this.localHandler.upload(
              localFile.absolutePath,
              localFile.size.value,
              context.abortController.signal,
            );

            Logger.info(localFile.absolutePath);

            if (uploadEither.isLeft()) {
              const error = uploadEither.getLeft();
              logger.error({
                tag: 'BACKUPS',
                msg: '[Local File Uploader] Error uploading file',
                path: localFile.absolutePath,
                error,
              });

              if (isFatalError(error.cause)) {
                throw error;
              }

              context.errors.add({ error: error.cause, name: localFile.relativePath });
              return; // Continuar con el siguiente archivo en paralelo
            }

            const contentsId = uploadEither.getRight();

            if (!contentsId) {
              return;
            }

            Logger.info('[Local File Uploader] Uploading file', localRootPath);

            const parentPath = dirname(localFile.relativePath) as RelativePath;
            const parent = remoteTree.folders[parentPath];

            logger.debug({ msg: 'Uploading file', remotePath: localFile.relativePath, parent });

            const file = await this.creator.run({
              contentsId,
              folderId: parent.id,
              folderUuid: parent.uuid,
              path: localFile.relativePath,
              size: localFile.size.value,
            });

            logger.info({ tag: 'BACKUPS', msg: 'File created', file });

            await onFileCreated({
              bucket: context.backupsBucket,
              name: file.name,
              extension: file.type,
              nameWithExtension: file.nameWithExtension,
              fileId: file.id,
              path: localFile.absolutePath,
            });
          } catch (error: any) {
            logger.error({
              tag: 'BACKUPS',
              msg: '[Local File Uploader] Error uploading file',
              path: localFile.relativePath,
              error,
            });

            if (isFatalError(error.cause)) {
              throw error;
            }

            context.errors.add({ error: error.cause, name: localFile.relativePath });
          } finally {
            updateProgress();
          }
        }),
      );
    }
  }
}
