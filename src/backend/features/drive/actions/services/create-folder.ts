import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { Sync } from '@/backend/features/sync';
import { Addon } from '@/node-win/addon-wrapper';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  ctx: SyncContext;
  path: AbsolutePath;
  parentUuid: FolderUuid;
};

export async function createFolder({ ctx, path, parentUuid }: Props) {
  try {
    const folder = await Sync.Actions.createFolder({ ctx, path, parentUuid });

    if (!folder) return;

    await Addon.convertToPlaceholder({ path, placeholderId: `FOLDER:${folder.uuid}` });
  } catch (error) {
    ctx.logger.error({ msg: 'Error creating folder', path, error });
  }
}
