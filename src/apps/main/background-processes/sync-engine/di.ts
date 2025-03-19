import { ContainerBuilder } from 'diod';
import { MonitorHealthService } from './monitor-health.service';
import { SpawnAllSyncEngineWorkersService } from './spawn-all-sync-engine-workers.service';
import { SpawnSyncEngineWorkerService } from './spawn-sync-engine-worker.service';
import { StopAndClearAllSyncEngineWorkersService } from './stop-and-clear-all-sync-engine-workers.service';
import { StopAndClearSyncEngineWorkerService } from './stop-and-clear-sync-engine-worker.service';

export function registerDI(builder: ContainerBuilder) {
  builder.registerAndUse(MonitorHealthService);
  builder.registerAndUse(SpawnAllSyncEngineWorkersService);
  builder.registerAndUse(SpawnSyncEngineWorkerService);
  builder.registerAndUse(StopAndClearAllSyncEngineWorkersService);
  builder.registerAndUse(StopAndClearSyncEngineWorkerService);
}
