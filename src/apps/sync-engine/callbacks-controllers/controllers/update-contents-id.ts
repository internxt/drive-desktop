import { logger } from '@/apps/shared/logger/logger';
import { updateFileStatus } from '@/backend/features/local-sync/placeholders/update-file-status';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { Stats } from 'fs';
import { ProcessSyncContext } from '../../config';

type TProps = {
  ctx: ProcessSyncContext;
  stats: Stats;
  path: RelativePath;
  absolutePath: AbsolutePath;
  uuid: string;
};

export async function updateContentsId({ ctx, stats, path, absolutePath, uuid }: TProps) {
  try {
    if (stats.size === 0 || stats.size > BucketEntry.MAX_SIZE) {
      logger.warn({
        tag: 'SYNC-ENGINE',
        msg: 'Invalid file size',
        path,
        size: stats.size,
      });
      return;
    }

    const contents = await ContentsUploader.run({ ctx, path, absolutePath, stats });

    const { data: fileDto, error } = await driveServerWip.files.replaceFile(
      {
        uuid,
        newContentId: contents.id,
        newSize: contents.size,
        modificationTime: stats.mtime.toISOString(),
      },
      { abortSignal: ctx.abortController.signal },
    );

    if (error) throw error;

    await ipcRendererSqlite.invoke('fileCreateOrUpdate', {
      file: {
        ...fileDto,
        size: Number(fileDto.size),
        isDangledStatus: false,
        userUuid: ctx.userUuid,
        workspaceId: ctx.workspaceId,
      },
      bucket: ctx.bucket,
      absolutePath,
    });

    updateFileStatus({ ctx, path });
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error updating contents id',
      path,
      uuid,
      exc,
    });
  }
}
