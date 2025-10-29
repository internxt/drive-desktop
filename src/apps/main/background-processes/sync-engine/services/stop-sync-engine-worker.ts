import { WorkerConfig, workers } from '@/apps/main/remote-sync/store';
import { unregisterVirtualDrives } from './unregister-virtual-drives';

type Props = {
  worker: WorkerConfig;
};

export function stopSyncEngineWorker({ worker }: Props) {
  const { ctx } = worker;

  ctx.logger.debug({ msg: 'Stop sync engine' });

  clearInterval(worker.syncSchedule);
  worker.browserWindow.destroy();
  workers.delete(ctx.workspaceId);
}

export function stopSyncEngineWorkers() {
  workers.forEach((worker) => {
    stopSyncEngineWorker({ worker });
  });

  unregisterVirtualDrives({});
}
