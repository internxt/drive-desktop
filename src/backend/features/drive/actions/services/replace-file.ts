import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { SyncContext } from '@/apps/sync-engine/config';
import { Sync } from '@/backend/features/sync';
import { Addon } from '@/node-win/addon-wrapper';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  ctx: SyncContext;
  path: AbsolutePath;
  uuid: FileUuid;
};

export async function replaceFile({ ctx, path, uuid }: Props) {
  try {
    const file = await Sync.Actions.replaceFile({ ctx, path, uuid });

    if (!file) return;

    await Addon.updateSyncStatus({ path });
  } catch (error) {
    ctx.logger.error({ msg: 'Error replacing file', path, error });
  }
}
