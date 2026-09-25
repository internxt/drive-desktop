import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { SyncContext } from '@/apps/sync-engine/config';
import { Sync } from '@/backend/features/sync';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { Addon } from '@/node-win/addon-wrapper';
import { InSyncState } from '@/node-win/types/placeholder.type';
import { waitForLocalFile } from './wait-for-local-file';

type Props = {
  ctx: SyncContext;
  path: AbsolutePath;
  uuid: FileUuid;
};

export async function replaceFile({ ctx, path, uuid }: Props) {
  try {
    const { error } = await waitForLocalFile({ ctx, path, retry: () => retryReplaceFile({ ctx, path, uuid }) });
    if (error) return;

    const file = await Sync.Actions.replaceFile({ ctx, path, uuid });

    if (!file) return;

    await Addon.updateSyncStatus({ path });
  } catch (error) {
    ctx.logger.error({ msg: 'Error replacing file', path, error });
  }
}

async function retryReplaceFile({ ctx, path, uuid }: Props) {
  const { data: fileInfo } = await NodeWin.getFileInfo({ path });
  if (fileInfo?.inSyncState !== InSyncState.NotSync) return;

  await replaceFile({ ctx, path, uuid });
}
