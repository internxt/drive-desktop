import { logger } from '@/apps/shared/logger/logger';
import nodeSchedule from 'node-schedule';
import { WorkerConfig } from './spawn-sync-engine-worker.service';
import { updateRemoteSync } from '@/apps/main/remote-sync/out/update-remote-sync.service';

type Props = {
  worker: WorkerConfig;
};

export class ScheduleRemoteSyncService {
  run({ worker }: Props) {
    worker.syncSchedule?.cancel(false);
    worker.syncSchedule = nodeSchedule.scheduleJob('0 0 */2 * * *', async () => {
      logger.debug({ msg: 'Received remote changes event' });
      await updateRemoteSync();
    });
  }
}
