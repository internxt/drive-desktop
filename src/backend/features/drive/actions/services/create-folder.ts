import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { Sync } from '@/backend/features/sync';
import { Addon } from '@/node-win/addon-wrapper';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { createPendingItems } from './create-pending-items';

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

    await createPendingItems({
      ctx,
      parentUuid: folder.uuid,
      parentPath: path,
      isFirstExecution: false,
    });
  } catch (error) {
    ctx.logger.error({ msg: 'Error creating folder', path, error });
  }
}
