import { WorkerConfig, workers } from '@/apps/main/remote-sync/store';
import { unregisterVirtualDrives } from './unregister-virtual-drives';
import { sleep } from '@/apps/main/util';
import VirtualDrive from '@/node-win/virtual-drive';

function stopSyncEngineWorker({ worker }: { worker: WorkerConfig }) {
  const { ctx } = worker;

  ctx.logger.debug({ msg: 'Stop sync engine' });

  clearInterval(worker.syncSchedule);
  worker.browserWindow.destroy();
  workers.delete(ctx.workspaceId);
}

export async function cleanSyncEngineWorker({ worker }: { worker: WorkerConfig }) {
  const { ctx } = worker;

  stopSyncEngineWorker({ worker });
  await sleep(2000);

  try {
    VirtualDrive.unregisterSyncRoot({ providerId: ctx.providerId });
  } catch (error) {
    ctx.logger.error({
      msg: 'Error unregistering sync root',
      providerId: ctx.providerId,
      error,
    });
  }
}

export async function cleanSyncEngineWorkers() {
  workers.forEach((worker) => {
    stopSyncEngineWorker({ worker });
  });

  await sleep(2000);
  unregisterVirtualDrives({});
}
