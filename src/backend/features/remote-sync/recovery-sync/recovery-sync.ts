import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { createOrUpdateFile } from '../update-in-sqlite/create-or-update-file';

export async function recoverySync() {
  const { data: localFiles } = await SqliteModule.FileModule.getByWorkspaceId({ workspaceId: '' });

  if (localFiles) {
    logger.debug({ msg: 'Local files', length: localFiles.length });

    const { data: remoteFiles } = await driveServerWip.files.getFiles({
      query: {
        limit: 100,
        offset: 0,
        status: 'EXISTS',
      },
    });

    if (remoteFiles) {
      const first = remoteFiles.at(0);
      const last = remoteFiles.at(-1);

      if (first && last) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Remote files',
          length: remoteFiles.length,
          first: { name: first.nameWithExtension, updatedAt: first.updatedAt },
          last: { name: last.nameWithExtension, updatedAt: last.updatedAt },
        });

        const localFilesMap = new Map(localFiles.map((file) => [file.uuid, file]));

        // Get remote files that are either missing locally or have different updatedAt
        const filesToSync = remoteFiles.filter((remoteFile) => {
          const localFile = localFilesMap.get(remoteFile.uuid);

          // File doesn't exist locally
          if (!localFile) {
            logger.debug({
              tag: 'SYNC-ENGINE',
              msg: 'Local file does not exist',
              name: remoteFile.nameWithExtension,
              updatedAt: remoteFile.updatedAt,
            });

            return true;
          }

          // File exists but has different updatedAt
          const different = localFile.updatedAt !== remoteFile.updatedAt || localFile.status !== remoteFile.status;

          if (different) {
            logger.debug({
              tag: 'SYNC-ENGINE',
              msg: 'Local file has a different status',
              localFile: { name: localFile.nameWithExtension, updatedAt: localFile.updatedAt },
              remoteFile: { remoteFile: last.nameWithExtension, updatedAt: remoteFile.updatedAt },
            });
          }

          return different;
        });

        const firstUpdatedAt = new Date(first.updatedAt);
        const lastUpdatedAt = new Date(last.updatedAt);

        const localFilesInRange = localFiles.filter((localFile) => {
          const localUpdatedAt = new Date(localFile.updatedAt);

          return localUpdatedAt >= firstUpdatedAt && localUpdatedAt <= lastUpdatedAt && localFile.status !== 'EXISTS';
        });

        logger.debug({ tag: 'SYNC-ENGINE', msg: 'Temp', length: localFilesInRange.length });

        // await Promise.all(filesToSync.map((fileDto) => createOrUpdateFile({ fileDto })));
      }
    }
  }
}
