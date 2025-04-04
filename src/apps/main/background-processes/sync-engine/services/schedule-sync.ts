import { logger } from '@/apps/shared/logger/logger';
import { TWorkerConfig } from '../store';
import nodeSchedule from 'node-schedule';
import { updateAllRemoteSync } from '@/apps/main/remote-sync/services/update-remote-sync';

type TProps = {
  worker: TWorkerConfig;
};

export function scheduleSync({ worker }: TProps) {
  worker.syncSchedule?.cancel(false);
  worker.syncSchedule = nodeSchedule.scheduleJob('*/15 * * * *', async () => {
    logger.debug({ msg: 'Received remote changes event' });
    updateAllRemoteSync();
  });
}
