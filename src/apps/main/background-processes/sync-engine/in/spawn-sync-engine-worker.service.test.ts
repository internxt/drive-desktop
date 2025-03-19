import { BrowserWindow } from 'electron';
import { workers } from '@/apps/main/background-processes/sync-engine';
import { SpawnSyncEngineWorkerService } from './spawn-sync-engine-worker.service';
import { mockDeep } from 'vitest-mock-extended';
import { MonitorHealthService } from './monitor-health.service';
import { mockProps } from 'tests/vitest/mocks.helper.test';
import { ScheduleRemoteSyncService } from './schedule-remote-sync.service';
import { StopAndClearSyncEngineWorkerService } from './stop-and-clear-sync-engine-worker.service';

describe('spawn-sync-engine-worker.service', () => {
  const monitorHealth = mockDeep<MonitorHealthService>();
  const stopAndClearSyncEngineWorker = mockDeep<StopAndClearSyncEngineWorkerService>();
  const scheduleRemoteSync = mockDeep<ScheduleRemoteSyncService>();
  const service = new SpawnSyncEngineWorkerService(monitorHealth, stopAndClearSyncEngineWorker, scheduleRemoteSync);

  const workspaceId = 'workspace1';
  const props = mockProps<SpawnSyncEngineWorkerService>({ config: { workspaceId } });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete workers[workspaceId];
  });

  it('Should start a worker if it is not already running', async () => {
    // When
    await service.run(props);

    // Then
    expect(BrowserWindow).toBeCalledTimes(1);
    expect(monitorHealth.run).toBeCalledTimes(1);
    expect(scheduleRemoteSync.run).toBeCalledTimes(1);
    expect(workers[workspaceId]).toStrictEqual({
      browserWindow: expect.anything(),
      workerIsRunning: false,
      startingWorker: true,
      syncSchedule: null,
    });
  });

  it('Should not start a worker if it is already running', async () => {
    // Given
    workers[workspaceId] = {
      browserWindow: new BrowserWindow(),
      workerIsRunning: true,
      startingWorker: false,
      syncSchedule: null,
    };

    // When
    await service.run(props);

    // Then
    expect(BrowserWindow).toBeCalledTimes(1);
    expect(monitorHealth.run).toBeCalledTimes(0);
    expect(scheduleRemoteSync.run).toBeCalledTimes(0);
    expect(workers[workspaceId]).toStrictEqual({
      browserWindow: expect.anything(),
      workerIsRunning: true,
      startingWorker: false,
      syncSchedule: null,
    });
  });
});
