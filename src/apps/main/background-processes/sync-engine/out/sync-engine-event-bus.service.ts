import { StopAndClearAllSyncEngineWorkersService } from '../in/stop-and-clear-all-sync-engine-workers.service';
import eventBus from '@/apps/main/event-bus';

export class SyncEngineEventBusService {
  constructor(private readonly stopAndClearAllSyncEngineWorkers = new StopAndClearAllSyncEngineWorkersService()) {}

  run() {
    eventBus.on('USER_LOGGED_OUT', async () => {
      await this.stopAndClearAllSyncEngineWorkers.run();
    });

    eventBus.on('USER_WAS_UNAUTHORIZED', async () => {
      await this.stopAndClearAllSyncEngineWorkers.run();
    });
  }
}
