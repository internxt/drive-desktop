import { workers } from '../../sync-engine';
import { StopAndClearSyncEngineWorkerService } from './stop-and-clear-sync-engine-worker.service';

export class StopAndClearAllSyncEngineWorkersService {
  constructor(private readonly stopAndClearSyncEngineWorker = new StopAndClearSyncEngineWorkerService()) {}

  async run() {
    await Promise.all(
      Object.keys(workers).map(async (workspaceId) => {
        await this.stopAndClearSyncEngineWorker.run({ workspaceId });
      }),
    );
  }
}
