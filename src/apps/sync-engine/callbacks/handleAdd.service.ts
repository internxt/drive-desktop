import VirtualDrive from '@/node-win/virtual-drive';
import { BindingsManager } from '../BindingManager';
import { isTemporaryFile } from '../../../apps/utils/isTemporalFile';
import { logger } from '@/apps/shared/logger/logger';
import { QueueItem } from '@/node-win/queue/queueManager';

type TProps = {
  self: BindingsManager;
  task: QueueItem;
  drive: VirtualDrive;
};

export class HandleAddService {
  async run({ self, task, drive }: TProps) {
    try {
      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'Path received from handle add',
        path: task.path,
      });

      const tempFile = isTemporaryFile(task.path);

      if (tempFile && !task.isFolder) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'File is temporary, skipping',
          path: task.path,
        });
        return;
      }

      await self.controllers.addFile.execute({ absolutePath: task.path, drive });
    } catch (error) {
      throw logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error adding file',
        path: task.path,
        exc: error,
      });
    }
  }
}
