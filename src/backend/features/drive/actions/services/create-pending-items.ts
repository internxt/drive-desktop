import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { statReaddir } from '@/infra/file-system/services/stat-readdir';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { createPendingFiles } from './create-pending-files';
import { createPendingFolders } from './create-pending-folders';

type Props = {
  ctx: SyncContext;
  parentUuid: FolderUuid;
  parentPath: AbsolutePath;
  isFirstExecution: boolean;
};

export async function createPendingItems({ ctx, parentUuid, parentPath, isFirstExecution }: Props) {
  try {
    const { files, folders } = await statReaddir({
      folder: parentPath,
      onError: ({ path, error }) => {
        ctx.logger.error({ msg: 'Error getting item stats', path, error });
      },
    });

    await Promise.all([
      createPendingFolders({ ctx, folders, parentUuid, isFirstExecution }),
      createPendingFiles({ ctx, files, parentUuid }),
    ]);
  } catch (error) {
    ctx.logger.error({ msg: 'Error creating pending items', parentPath, error });
  }
}
