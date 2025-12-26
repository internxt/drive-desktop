import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { StatItem } from '@/infra/file-system/services/stat-readdir';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { createPendingItems } from './create-pending-items';
import { createFolder } from './create-folder';

type Props = {
  ctx: SyncContext;
  folders: StatItem[];
  parentUuid: FolderUuid;
  isFirstExecution: boolean;
};

export async function createPendingFolders({ ctx, folders, parentUuid, isFirstExecution }: Props) {
  await Promise.all(
    folders.map(async ({ path }) => {
      const { data: folderInfo, error } = await NodeWin.getFolderInfo({ ctx, path });

      if (folderInfo && isFirstExecution) {
        await createPendingItems({
          ctx,
          parentPath: path,
          parentUuid: folderInfo.uuid,
          isFirstExecution,
        });
      }

      if (error) {
        if (error.code === 'NOT_A_PLACEHOLDER') {
          await createFolder({ ctx, path, parentUuid });
        } else {
          ctx.logger.error({ msg: 'Error getting folder info', path, error });
        }
      }
    }),
  );
}
