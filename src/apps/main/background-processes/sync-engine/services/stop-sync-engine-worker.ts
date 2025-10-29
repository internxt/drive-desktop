import { WorkerConfig, workers } from '@/apps/main/remote-sync/store';
import { unregisterVirtualDrives } from './unregister-virtual-drives';
import { sleep } from '@/apps/main/util';

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

export async function stopSyncEngineWorkers() {
  workers.forEach((worker) => {
    stopSyncEngineWorker({ worker });
  });

  await sleep(2000);
  unregisterVirtualDrives({});
}
