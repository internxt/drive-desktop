import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { Stats } from 'node:fs';
import { ProcessSyncContext } from '../../config';
import { SyncModule } from '@internxt/drive-desktop-core/build/backend';

type TProps = {
  ctx: ProcessSyncContext;
  stats: Stats;
  path: RelativePath;
  absolutePath: AbsolutePath;
  uuid: string;
};

export async function updateContentsId({ ctx, stats, path, absolutePath, uuid }: TProps) {
  try {
    if (stats.size === 0 || stats.size > SyncModule.MAX_FILE_SIZE) {
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

    ctx.virtualDrive.updateSyncStatus({ itemPath: path });
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
