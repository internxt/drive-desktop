import { SyncContext } from '@/apps/sync-engine/config';
import { BrowserWindow } from 'electron';
import path from 'node:path';
import { cwd } from 'node:process';
import { WorkerConfig, workers } from '@/apps/main/remote-sync/store';
import { monitorHealth } from './monitor-health';
import { addRemoteSyncManager } from '@/apps/main/remote-sync/handlers';
import { RecoverySyncModule } from '@/backend/features/sync/recovery-sync/recovery-sync.module';
import { scheduleSync } from './schedule-sync';
import { stopSyncEngineWorker } from './stop-sync-engine-worker';

type TProps = {
  ctx: SyncContext;
};

export async function spawnSyncEngineWorker({ ctx }: TProps) {
  ctx.logger.debug({ msg: 'Spawn sync engine worker' });

  /**
   * v2.5.6 Daniel Jiménez
   * Since we can have a different status in our local database that in remote,
   * we want to run also this sync in background to update the statuses.
   */
  void RecoverySyncModule.recoverySync({ ctx });

  try {
    const browserWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        backgroundThrottling: false,
      },
    });

    /**
     * v2.5.4 Daniel Jiménez
     * We want to print just the first console message of the renderer process.
     * If we print all of them, then we fill the console and the log with duplicated messages.
     * If we do not print any of them and there is an error in the renderer process we do
     * not have any way of knowing what went wrong. Usually the error is printed in the
     * first message.
     */
    let hasPrinted = false;

    browserWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      if (!hasPrinted) {
        ctx.logger.debug({
          msg: 'Sync engine worker console message',
          level,
          message,
          line,
          sourceId,
        });

        hasPrinted = true;
      }
    });

    addRemoteSyncManager({ context: ctx });

    const worker: WorkerConfig = {
      ctx,
      browserWindow,
      syncSchedule: scheduleSync({ ctx }),
    };

    workers.set(ctx.workspaceId, worker);

    monitorHealth({
      browserWindow,
      stopAndSpawn: async () => {
        stopSyncEngineWorker({ worker });
        await spawnSyncEngineWorker({ ctx });
      },
    });

    await browserWindow.loadFile(
      process.env.NODE_ENV === 'development'
        ? path.join(cwd(), 'dist', 'sync-engine', 'index.html')
        : path.join(__dirname, '..', 'sync-engine', 'index.html'),
    );

    ctx.logger.debug({ msg: 'Browser window loaded' });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { logger, ...config } = ctx;
    browserWindow.webContents.send('SET_CONFIG', config);
  } catch (exc) {
    ctx.logger.error({ msg: 'Error loading sync engine worker', exc });
  }
}
