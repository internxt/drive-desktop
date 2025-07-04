import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { onAdd } from '@/node-win/watcher/events/on-add.service';
import { Watcher } from '@/node-win/watcher/watcher';

type TProps = {
  watcher: Watcher;
  absolutePaths: AbsolutePath[];
};

export async function addPendingFiles({ watcher, absolutePaths }: TProps) {
  await Promise.all(
    absolutePaths.map(async (absolutePath) => {
      const { data: stats } = await fileSystem.stat({ absolutePath });
      if (stats) {
        await onAdd({ self: watcher, absolutePath, stats });
      } else {
        logger.warn({
          tag: 'SYNC-ENGINE',
          msg: 'Error adding pending file',
          absolutePath,
        });
      }
    }),
  );
}
