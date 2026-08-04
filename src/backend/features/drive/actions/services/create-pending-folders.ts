import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { getWorkerCount } from '@/core/utils/concurrency';
import { StatItem } from '@/infra/file-system/services/stat-readdir';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { CREATE_PENDING_ITEMS_CONCURRENCY } from './constants';
import { createFolder } from './create-folder';
import { createPendingItems } from './create-pending-items';

type Props = {
  ctx: SyncContext;
  folders: StatItem[];
  parentUuid: FolderUuid;
  isFirstExecution: boolean;
};
export async function createPendingFolders({ ctx, folders, parentUuid, isFirstExecution }: Props) {
  let nextFolderIndex = 0;
  const workerCount = getWorkerCount({ concurrency: CREATE_PENDING_ITEMS_CONCURRENCY, itemCount: folders.length });

  async function processNextFolder() {
    while (nextFolderIndex < folders.length) {
      if (ctx.abortController.signal.aborted) return;

      const { path } = folders[nextFolderIndex];
      nextFolderIndex += 1;
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
    }
  }

  await Promise.all(Array.from({ length: workerCount }, processNextFolder));
}
