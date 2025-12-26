import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { Sync } from '@/backend/features/sync';
import { Addon } from '@/node-win/addon-wrapper';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Stats } from 'node:fs';

type Props = {
  ctx: SyncContext;
  path: AbsolutePath;
  parentUuid: FolderUuid;
  stats: Stats;
};

export async function createFile({ ctx, path, stats, parentUuid }: Props) {
  try {
    const file = await Sync.Actions.createFile({ ctx, path, stats, parentUuid });

    if (!file) return;

    await Addon.convertToPlaceholder({ path, placeholderId: `FILE:${file.uuid}` });
  } catch (error) {
    ctx.logger.error({ msg: 'Error creating file', path, error });
  }
}
