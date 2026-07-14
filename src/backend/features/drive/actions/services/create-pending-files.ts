import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { StatItem } from '@/infra/file-system/services/stat-readdir';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { createFile } from './create-file';

type Props = {
  ctx: SyncContext;
  files: StatItem[];
  parentUuid: FolderUuid;
};

export async function createPendingFiles({ ctx, files, parentUuid }: Props) {
  // TODO PB-6612: Bound pending file processing. Large local folders can fan out
  // too many NodeWin/upload/config reads and hit EMFILE before bottlenecks apply.
  await Promise.all(
    files.map(async ({ path }) => {
      const { error } = await NodeWin.getFileInfo({ path });

      if (error) {
        if (error.code === 'NOT_A_PLACEHOLDER') {
          await createFile({ ctx, path, parentUuid });
        } else {
          ctx.logger.error({ msg: 'Error getting file info', path, error });
        }
      }
    }),
  );
}
