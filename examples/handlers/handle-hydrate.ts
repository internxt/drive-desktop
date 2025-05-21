import { drive, logger } from 'examples/drive';

import { QueueItem } from '@/node-win/queue/queueManager';

export const handleHydrate = async (task: QueueItem) => {
  try {
    logger.debug({ msg: 'handleHydrate', path: task.path });
    await drive.hydrateFile({
      itemPath: task.path,
    });
  } catch (error) {
    logger.error({ msg: 'handleHydrate', error });
  }
};
