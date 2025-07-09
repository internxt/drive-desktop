import VirtualDrive from '@/node-win/virtual-drive';
import { logger } from '@/apps/shared/logger/logger';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

export type Task = {
  path: RelativePath;
};

type TProps = {
  drive: VirtualDrive;
  task: Task;
};

export async function handleHydrate({ drive, task }: TProps) {
  try {
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Hydrating file',
      path: task.path,
    });

    await drive.hydrateFile({ itemPath: task.path });

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'File hydrated',
      path: task.path,
    });
  } catch (error) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error hydrating file',
      path: task.path,
      error,
    });
  }
}
