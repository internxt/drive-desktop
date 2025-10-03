import { spawnSyncEngineWorker } from './spawn-sync-engine-worker';
import { mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { TWorkerConfig, workers } from '../store';
import { BrowserWindow } from 'electron';
import { monitorHealth } from './monitor-health';
import { scheduleSync } from './schedule-sync';
import { loggerMock } from 'tests/vitest/mocks.helper.test';
import { RecoverySyncModule } from '@/backend/features/sync/recovery-sync/recovery-sync.module';

vi.mock(import('./stop-and-clear-sync-engine-worker'));
vi.mock(import('./monitor-health'));
vi.mock(import('./schedule-sync'));

describe('spawn-sync-engine-worker', () => {
  const monitorHealthMock = vi.mocked(monitorHealth);
  const scheduleSyncMock = vi.mocked(scheduleSync);
  const recoverySyncMock = partialSpyOn(RecoverySyncModule, 'recoverySync');

  const workspaceId = 'workspaceId';
  const props = mockProps<typeof spawnSyncEngineWorker>({ ctx: { workspaceId } });

  beforeEach(() => {
    delete workers[workspaceId];
  });

  it('If worker does not exist then create and start it', async () => {
    // When
    await spawnSyncEngineWorker(props);
    // Then
    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(monitorHealthMock).toHaveBeenCalledTimes(1);
    expect(scheduleSyncMock).toHaveBeenCalledTimes(1);
    expect(recoverySyncMock).toHaveBeenCalledTimes(1);
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
    workers[workspaceId] = { startingWorker: true } as unknown as TWorkerConfig;
    // When
    await spawnSyncEngineWorker(props);
    // Then
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Sync engine worker is already starting' });
    expect(BrowserWindow).toHaveBeenCalledTimes(0);
    expect(monitorHealthMock).toHaveBeenCalledTimes(0);
    expect(scheduleSyncMock).toHaveBeenCalledTimes(0);
  });

  it('If worker is already running then do nothing', async () => {
    // Given
    workers[workspaceId] = { workerIsRunning: true } as unknown as TWorkerConfig;
    // When
    await spawnSyncEngineWorker(props);
    // Then
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Sync engine worker is already running' });
    expect(BrowserWindow).toHaveBeenCalledTimes(0);
    expect(monitorHealthMock).toHaveBeenCalledTimes(0);
    expect(scheduleSyncMock).toHaveBeenCalledTimes(0);
  });
});
