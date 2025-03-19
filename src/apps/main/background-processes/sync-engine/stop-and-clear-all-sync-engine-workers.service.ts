import { Service } from 'diod';
import { StopAndClearSyncEngineWorkerService } from './stop-and-clear-sync-engine-worker.service';
import { workers } from '../sync-engine';

@Service()
export class StopAndClearAllSyncEngineWorkersService {
  constructor(private readonly stopAndClearSyncEngineWorker: StopAndClearSyncEngineWorkerService) {}

  async run() {
    await Promise.all(
      Object.keys(workers).map(async (workspaceId) => {
        await this.stopAndClearSyncEngineWorker.run({ workspaceId });
      }),
    );
  }
}
