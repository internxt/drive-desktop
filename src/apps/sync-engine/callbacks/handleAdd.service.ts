import { QueueItem, VirtualDrive } from '@internxt/node-win/dist';
import { BindingsManager } from '../BindingManager';
import { isTemporaryFile } from '../../../apps/utils/isTemporalFile';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  self: BindingsManager;
  task: QueueItem;
  drive: VirtualDrive;
};

export class HandleAddService {
  async run({ self, task, drive }: TProps) {
    try {
      logger.debug({
        msg: 'Path received from handle add',
        path: task.path,
      });

      const tempFile = isTemporaryFile(task.path);

      logger.debug({
        msg: '[isTemporaryFile]',
        tempFile,
      });

      if (tempFile && !task.isFolder) {
        logger.debug({ msg: 'File is temporary, skipping' });
        return;
      }

      const itemId = await self.controllers.addFile.execute(task.path);
      if (!itemId) {
        logger.warn({
          msg: 'Error adding file',
          path: task.path,
        });
        return;
      }

      drive.convertToPlaceholder({
        itemPath: task.path,
        id: itemId,
      });
      drive.updateSyncStatus({
        itemPath: task.path,
        isDirectory: task.isFolder,
        sync: true,
      });
    } catch (error) {
      throw logger.error({
        msg: `Error adding file ${task.path}`,
        exc: error,
      });
    }
  }
}
