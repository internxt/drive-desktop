import { Service } from 'diod';
import { LocalFile } from '../../domain/LocalFile';
import { SimpleFileCreator } from '../../../../virtual-drive/files/application/create/SimpleFileCreator';
import Logger from 'electron-log';
import { logger } from '@/apps/shared/logger/logger';
import { onFileCreated } from '@/apps/main/fordwardToWindows';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { RemoteTree } from '@/apps/backups/remote-tree/traverser';
import { pathUtils } from '../../infrastructure/AbsolutePath';
import { EnvironmentFileUploader } from '@/infra/inxt-js/services/environment-file-uploader';

@Service()
export class FileBatchUploader {
  constructor(
    private readonly localHandler: EnvironmentFileUploader,
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
            const { data: contentsId, error } = await this.localHandler.upload({
              path: localFile.absolutePath,
              size: localFile.size.value,
              abortSignal: context.abortController.signal,
            });

            Logger.info(localFile.absolutePath);

            if (error) {
              if (error.code !== 'KILLED_BY_USER') {
                logger.error({
                  tag: 'BACKUPS',
                  msg: 'Error uploading file',
                  path: localFile.absolutePath,
                  error,
                });

                if (error.code !== 'UNKNOWN') {
                  context.addIssue({
                    error: error.code,
                    name: localFile.relativePath,
                  });
                }
              }
            } else {
              const parentPath = pathUtils.dirname(localFile.relativePath);
              const parent = remoteTree.folders[parentPath];

              logger.debug({
                tag: 'BACKUPS',
                msg: 'Uploading file',
                remotePath: localFile.relativePath,
              });

              const file = await this.creator.run({
                contentsId,
                folderUuid: parent.uuid,
                path: localFile.relativePath,
                size: localFile.size.value,
              });

              logger.info({
                tag: 'BACKUPS',
                msg: 'File created',
                relativePath: file.path,
                contentsId: file.contentsId,
              });

              await onFileCreated({
                bucket: context.backupsBucket,
                name: file.name,
                extension: file.type,
                nameWithExtension: file.nameWithExtension,
                fileId: file.id,
                path: localFile.absolutePath,
              });
            }
          } catch (error) {
            logger.error({
              tag: 'BACKUPS',
              msg: 'Error uploading file',
              path: localFile.relativePath,
              error,
            });
          } finally {
            updateProgress();
          }
        }),
      );
    }
  }
}
