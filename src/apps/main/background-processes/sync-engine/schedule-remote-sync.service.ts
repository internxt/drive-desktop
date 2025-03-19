import { Service } from 'diod';
import { WorkerConfig } from './spawn-sync-engine-worker.service';
import { logger } from '@/apps/shared/logger/logger';
import { updateRemoteSync } from '../../remote-sync/handlers';
import nodeSchedule from 'node-schedule';

type Props = {
  worker: WorkerConfig;
};

@Service()
export class ScheduleRemoteSyncService {
  run({ worker }: Props) {
    worker.syncSchedule?.cancel(false);
    worker.syncSchedule = nodeSchedule.scheduleJob('0 0 */2 * * *', async () => {
      logger.debug({ msg: 'Received remote changes event' });
      await updateRemoteSync();
    });
  }
}
