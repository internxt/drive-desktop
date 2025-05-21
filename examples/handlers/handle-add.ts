import { drive, logger } from 'examples/drive';
import { addInfoItem } from 'examples/info-items-manager';
import { v4 } from 'uuid';

import { QueueItem } from '@/node-win/queue/queueManager';

export const handleAdd = async (task: QueueItem) => {
  try {
    logger.debug({ msg: 'handleAdd', task });
    const id = task.isFolder ? v4() : addInfoItem(task.path);
    drive.convertToPlaceholder({
      itemPath: task.path,
      id,
    });
  } catch (error) {
    logger.error({ msg: 'handleAdd', error });
  }
};
