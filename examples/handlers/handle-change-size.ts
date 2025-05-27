import { drive, logger } from 'examples/drive';
import { v4 } from 'uuid';

import { QueueItem } from '@/node-win/queue/queueManager';

export const handleChangeSize =  (task: QueueItem) => {
  try {
    logger.debug({ msg: 'handleChangeSize', path: task.path });
    const id = v4();
    drive.convertToPlaceholder({
      itemPath: task.path,
      id,
    });
    drive.updateFileIdentity({
      itemPath: task.path,
      id,
      isDirectory: task.isFolder,
    });
  } catch (error) {
    logger.error({ msg: 'handleChangeSize', error });
  }
};
