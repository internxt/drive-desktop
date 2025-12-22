import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { SyncContext } from '@/apps/sync-engine/config';
import { Sync } from '@/backend/features/sync';
import { Addon } from '@/node-win/addon-wrapper';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Stats } from 'node:fs';

type Props = {
  ctx: SyncContext;
  path: AbsolutePath;
  uuid: FileUuid;
  stats: Stats;
};

export async function replaceFile({ ctx, path, uuid, stats }: Props) {
  try {
    const file = await Sync.Actions.replaceFile({ ctx, path, uuid, stats });

    if (!file) return;

    await Addon.updateSyncStatus({ path });
  } catch (error) {
    ctx.logger.error({ msg: 'Error replacing file', path, error });
  }
}
