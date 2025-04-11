/* eslint-disable @typescript-eslint/no-explicit-any */
import { Service } from 'diod';
import { LocalFile } from '../../domain/LocalFile';
import { SimpleFileCreator } from '../../../../virtual-drive/files/application/create/SimpleFileCreator';
import { RemoteTree } from '../../../../virtual-drive/remoteTree/domain/RemoteTree';
import { relativeV2 } from '../../../../../apps/backups/utils/relative';
import { isFatalError } from '../../../../../apps/shared/issues/SyncErrorCause';
import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { RendererIpcLocalFileMessenger } from '../../infrastructure/RendererIpcLocalFileMessenger';
import { EnvironmentLocalFileUploader } from '../../infrastructure/EnvironmentLocalFileUploader';
import { logger } from '@/apps/shared/logger/logger';

@Service()
export class FileBatchUploader {
  constructor(
    private readonly localHandler: EnvironmentLocalFileUploader,
    private readonly creator: SimpleFileCreator,
    protected readonly messenger: RendererIpcLocalFileMessenger,
  ) {}

  async run(
    localRootPath: string,
    remoteTree: RemoteTree,
    batch: Array<LocalFile>,
    signal: AbortSignal,
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
            const uploadEither = await this.localHandler.upload(localFile.path, localFile.size, signal);
            Logger.info(localFile.path);

            if (uploadEither.isLeft()) {
              const error = uploadEither.getLeft();
              logger.error({ msg: '[Local File Uploader] Error uploading file', path: localFile.path, error });

              if (isFatalError(error.cause)) {
                throw error;
              }

              await this.messenger.creationFailed(localFile, error);
              return; // Continuar con el siguiente archivo en paralelo
            }

            const contentsId = uploadEither.getRight();

            Logger.info('[Local File Uploader] Uploading file', localRootPath);

            const remotePath = relativeV2(localRootPath, localFile.path);
            const parent = remoteTree.getParent(remotePath);

            logger.debug({ msg: 'Uploading file', remotePath, parent });

            const either = await this.creator.run({
              contentsId,
              folderId: parent.id,
              folderUuid: parent.uuid,
              path: remotePath,
              size: localFile.size,
            });

            if (either.isLeft()) {
              await this.localHandler.delete(contentsId);
              const error = either.getLeft();

              if (error.cause === 'FILE_ALREADY_EXISTS') {
                return; // Continuar con el siguiente archivo en paralelo
              }

              if (error.cause === 'BAD_RESPONSE') {
                await this.messenger.creationFailed(localFile, error);
                return; // Continuar con el siguiente archivo en paralelo
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
            Logger.error('[Local File Uploader] Error uploading file', localFile.path, error);

            if (isFatalError(error.cause)) {
              throw error;
            }

            await this.messenger.creationFailed(localFile, error);
          } finally {
            await updateProgress();
          }
        }),
      );
    }
  }
}
