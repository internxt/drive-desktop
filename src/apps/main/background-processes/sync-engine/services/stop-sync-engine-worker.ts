import { WorkerConfig, workers } from '@/apps/main/remote-sync/store';
import { sleep } from '@/apps/main/util';
import { Addon } from '@/node-win/addon-wrapper';

async function stopSyncEngineWorker({ worker }: { worker: WorkerConfig }) {
  const { ctx } = worker;

  ctx.logger.debug({ msg: 'Stop sync engine' });

  clearInterval(worker.syncSchedule);
  await worker.watcher.close();
  worker.browserWindow.destroy();
  workers.delete(ctx.workspaceId);
}

export async function cleanSyncEngineWorker({ worker }: { worker: WorkerConfig }) {
  const { ctx } = worker;

  await stopSyncEngineWorker({ worker });
  await sleep(2000);

  try {
    await Addon.unregisterSyncRoot({ providerId: ctx.providerId });
  } catch (error) {
    ctx.logger.error({
      msg: 'Error unregistering sync root',
      providerId: ctx.providerId,
      error,
    });
  }
}

export async function cleanSyncEngineWorkers() {
  await Promise.all(workers.values().map((worker) => cleanSyncEngineWorker({ worker })));
}
