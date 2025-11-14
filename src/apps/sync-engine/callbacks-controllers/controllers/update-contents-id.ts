import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { Stats } from 'node:fs';
import { ProcessSyncContext } from '../../config';
import { SyncModule } from '@internxt/drive-desktop-core/build/backend';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';

type TProps = {
  ctx: ProcessSyncContext;
  stats: Stats;
  path: AbsolutePath;
  uuid: string;
};

export async function updateContentsId({ ctx, stats, path, uuid }: TProps) {
  try {
    if (stats.size === 0) {
      ctx.logger.warn({ msg: 'File is empty', path });
      return;
    }

    if (stats.size > SyncModule.MAX_FILE_SIZE) {
      ctx.logger.warn({ msg: 'File size is too big', path, size: stats.size });
      ipcRendererSyncEngine.send('ADD_SYNC_ISSUE', { error: 'FILE_SIZE_TOO_BIG', name: path });
      return;
    }

    const contents = await ContentsUploader.run({ ctx, path, stats });

    const { data: fileDto, error } = await driveServerWip.files.replaceFile({
      uuid,
      newContentId: contents.id,
      newSize: contents.size,
      modificationTime: stats.mtime.toISOString(),
    });

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
      path,
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
