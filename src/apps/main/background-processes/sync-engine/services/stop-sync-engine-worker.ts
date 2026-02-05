import { WorkerConfig, workers } from '@/apps/main/remote-sync/store';
import { Addon } from '@/node-win/addon-wrapper';

function stopSyncEngineWorker({ worker }: { worker: WorkerConfig }) {
  const { ctx } = worker;

  ctx.logger.debug({ msg: 'Stop sync engine' });

  clearInterval(worker.syncSchedule);
  clearInterval(worker.workspaceTokenInterval);
  worker.watcher.unsubscribe();
  workers.delete(ctx.workspaceId);
}

export async function cleanSyncEngineWorker({ worker }: { worker: WorkerConfig }) {
  const { ctx } = worker;

  try {
    stopSyncEngineWorker({ worker });
    await Addon.disconnectSyncRoot({ connectionKey: worker.connectionKey });
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
