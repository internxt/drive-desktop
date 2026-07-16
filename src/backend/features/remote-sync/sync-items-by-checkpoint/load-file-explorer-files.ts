import pLimit from 'p-limit';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { getWorkerCount } from '@/core/utils/concurrency';
import { StatItem } from '@/infra/file-system/services/stat-readdir';
import { NodeWin } from '@/infra/node-win/node-win.module';
import type { FileExplorerFiles } from './load-in-memory-paths';

export async function loadFileExplorerFiles({
  files,
  items,
  limit,
  parentUuid,
}: {
  files: FileExplorerFiles;
  items: StatItem[];
  limit: ReturnType<typeof pLimit>;
  parentUuid: FolderUuid;
}): Promise<void> {
  let nextItemIndex = 0;
  const workerCount = getWorkerCount({ concurrency: limit.concurrency, itemCount: items.length });

  async function processNextItem() {
    while (nextItemIndex < items.length) {
      const { path, stats } = items[nextItemIndex];
      nextItemIndex += 1;

      const { data: placeholder } = await NodeWin.getFileInfo({ path });
      if (placeholder) {
        files.set(placeholder.uuid, {
          path,
          parentUuid,
          mtimeMs: stats.mtimeMs,
          size: stats.size,
          onDiskSize: placeholder.onDiskSize,
          pinState: placeholder.pinState,
        });
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => limit(processNextItem)));
}
