import { mockDeep } from 'vitest-mock-extended';
import { SpawnSyncEngineWorkerService } from './spawn-sync-engine-worker.service';
import { MonitorHealthService } from './monitor-health.service';
import { ScheduleSyncService } from './schedule-sync.service';
import { StopAndClearSyncEngineWorkerService } from './stop-and-clear-sync-engine-worker.service';
import { LoggerService } from '@/apps/shared/logger/logger';
import { mockProps } from 'tests/vitest/utils.helper.test';
import { workers } from '../store';
import { BrowserWindow } from 'electron';

describe('spawn-sync-engine-worker.service', () => {
  const monitorHealth = mockDeep<MonitorHealthService>();
  const scheduleSync = mockDeep<ScheduleSyncService>();
  const stopAndClearSyncEngineWorker = mockDeep<StopAndClearSyncEngineWorkerService>();
  const logger = mockDeep<LoggerService>();
  const service = new SpawnSyncEngineWorkerService(monitorHealth, scheduleSync, stopAndClearSyncEngineWorker, logger);

  const workspaceId = 'workspaceId';

  beforeEach(() => {
    delete workers[workspaceId];
    vi.clearAllMocks();
  });

  it('If worker does not exist then create and start it', async () => {
    // Given
    const props = mockProps<typeof service.run>({ config: { workspaceId } });

    // When
    await service.run(props);

    // Then
    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(monitorHealth.run).toHaveBeenCalledTimes(1);
    expect(scheduleSync.run).toHaveBeenCalledTimes(1);
    expect(workers[workspaceId]).toStrictEqual(
      expect.objectContaining({
        startingWorker: true,
        syncSchedule: null,
        workerIsRunning: false,
        worker: expect.anything(),
      }),
    );
  });

  it('If worker is already starting then do nothing', async () => {
    // Given
    workers[workspaceId] = { startingWorker: true } as any;
    const props = mockProps<typeof service.run>({ config: { workspaceId } });

    // When
    await service.run(props);

    // Then
    expect(logger.debug).toHaveBeenCalledWith({ msg: '[MAIN] Sync engine worker is already starting', workspaceId });
    expect(BrowserWindow).toHaveBeenCalledTimes(0);
    expect(monitorHealth.run).toHaveBeenCalledTimes(0);
    expect(scheduleSync.run).toHaveBeenCalledTimes(0);
  });

  it('If worker is already running then do nothing', async () => {
    // Given
    workers[workspaceId] = { workerIsRunning: true } as any;
    const props = mockProps<typeof service.run>({ config: { workspaceId } });

    // When
    await service.run(props);

    // Then
    expect(logger.debug).toHaveBeenCalledWith({ msg: '[MAIN] Sync engine worker is already running', workspaceId });
    expect(BrowserWindow).toHaveBeenCalledTimes(0);
    expect(monitorHealth.run).toHaveBeenCalledTimes(0);
    expect(scheduleSync.run).toHaveBeenCalledTimes(0);
  });
});
