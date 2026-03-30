import { WorkerConfig, workers } from '@/apps/main/remote-sync/store';
import { Addon } from '@/node-win/addon-wrapper';

export async function cleanSyncEngineWorker({ worker }: { worker: WorkerConfig }) {
  const { ctx } = worker;

  ctx.logger.debug({ msg: 'Stop sync engine' });

  try {
    clearInterval(worker.syncSchedule);
    clearInterval(worker.workspaceTokenInterval);
    // We need to unwatch first the drive, otherwise when we unregister the sync root
    // we are going to receive a delete event for every placeholder that is inside.
    worker.watcher?.unsubscribe();

    await Addon.disconnectSyncRoot({ connectionKey: worker.connectionKey });
    await Addon.unregisterSyncRoot({ providerId: ctx.providerId });

    workers.delete(ctx.workspaceId);
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
