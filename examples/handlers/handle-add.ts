import { drive, logger } from 'examples/drive';
import { addInfoItem } from 'examples/info-items-manager';
import { v4 } from 'uuid';

import { QueueItem } from '@/node-win/queue/queueManager';
import { sleep } from '@/apps/main/util';

export const handleAdd = async (task: QueueItem) => {
  try {
    logger.debug({ msg: 'handleAdd', task });
    const id = task.isFolder ? v4() : addInfoItem(task.path);
    drive.convertToPlaceholder({
      itemPath: task.path,
      id,
    });
    await sleep(100); // Simulate some processing time
  } catch (error) {
    logger.error({ msg: 'handleAdd', error });
  }
};
