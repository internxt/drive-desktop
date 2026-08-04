import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { getWorkerCount } from '@/core/utils/concurrency';
import { StatItem } from '@/infra/file-system/services/stat-readdir';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { CREATE_PENDING_ITEMS_CONCURRENCY } from './constants';
import { createFile } from './create-file';

type Props = {
  ctx: SyncContext;
  files: StatItem[];
  parentUuid: FolderUuid;
};

export async function createPendingFiles({ ctx, files, parentUuid }: Props) {
  let nextFileIndex = 0;
  const workerCount = getWorkerCount({ concurrency: CREATE_PENDING_ITEMS_CONCURRENCY, itemCount: files.length });

  async function processNextFile() {
    while (nextFileIndex < files.length) {
      if (ctx.abortController.signal.aborted) return;

      const { path } = files[nextFileIndex];
      nextFileIndex += 1;
      const { error } = await NodeWin.getFileInfo({ path });

      if (error) {
        if (error.code === 'NOT_A_PLACEHOLDER') {
          await createFile({ ctx, path, parentUuid });
        } else {
          ctx.logger.error({ msg: 'Error getting file info', path, error });
        }
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, processNextFile));
}
