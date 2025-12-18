import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { Stats } from 'node:fs';
import { ProcessSyncContext } from '../../config';
import { SyncModule } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { persistReplaceFile } from '@/infra/drive-server-wip/out/ipc-main';
import { addSyncIssue } from '@/apps/main/background-processes/issues';

type TProps = {
  ctx: ProcessSyncContext;
  stats: Stats;
  path: AbsolutePath;
  uuid: FileUuid;
};

export async function updateContentsId({ ctx, stats, path, uuid }: TProps) {
  try {
    const { size } = stats;

    if (size === 0) {
      ctx.logger.warn({ msg: 'File is empty', path });
      return;
    }

    if (size > SyncModule.MAX_FILE_SIZE) {
      ctx.logger.warn({ msg: 'File size is too big', path, size });
      addSyncIssue({ error: 'FILE_SIZE_TOO_BIG', name: path });
      return;
    }

    const contentsId = await ContentsUploader.run({ ctx, path, size });

    const { error } = await persistReplaceFile({
      ctx,
      path,
      uuid,
      size,
      modificationTime: stats.mtime.toISOString(),
      contentsId,
    });

    if (error) throw error;

    await Addon.updateSyncStatus({ path });
  } catch (exc) {
    ctx.logger.error({ msg: 'Error updating contents id', path, exc });
  }
}
