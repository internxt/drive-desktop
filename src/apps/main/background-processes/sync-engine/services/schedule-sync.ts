import { logger } from '@/apps/shared/logger/logger';
import { TWorkerConfig } from '../store';
import nodeSchedule from 'node-schedule';
import { debouncedSynchronization } from '@/apps/main/remote-sync/handlers';

type TProps = {
  worker: TWorkerConfig;
};

export function scheduleSync({ worker }: TProps) {
  worker.syncSchedule?.cancel(false);
  worker.syncSchedule = nodeSchedule.scheduleJob('*/10 * * * *', async () => {
    logger.debug({ msg: 'Received remote changes event' });
    await debouncedSynchronization();
  });
}
