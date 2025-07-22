import { spawnSyncEngineWorker } from './spawn-sync-engine-worker';
import { mockProps } from 'tests/vitest/utils.helper.test';
import { TWorkerConfig, workers } from '../store';
import { BrowserWindow } from 'electron';
import { monitorHealth } from './monitor-health';
import { scheduleSync } from './schedule-sync';
import { loggerMock } from 'tests/vitest/mocks.helper.test';
// import { RemoteSyncModule } from '@/backend/features/remote-sync/remote-sync.module';

vi.mock(import('./stop-and-clear-sync-engine-worker'));
vi.mock(import('./monitor-health'));
vi.mock(import('./schedule-sync'));
vi.mock(import('@/backend/features/remote-sync/remote-sync.module'));

describe('spawn-sync-engine-worker', () => {
  const monitorHealthMock = vi.mocked(monitorHealth);
  const scheduleSyncMock = vi.mocked(scheduleSync);
  // const RemoteSyncModuleMock = vi.mocked(RemoteSyncModule);

  const workspaceId = 'workspaceId';

  beforeEach(() => {
    delete workers[workspaceId];
  });

  it('If worker does not exist then create and start it', async () => {
    // Given
    const props = mockProps<typeof spawnSyncEngineWorker>({ config: { workspaceId } });

    // When
    await spawnSyncEngineWorker(props);

    // Then
    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(monitorHealthMock).toHaveBeenCalledTimes(1);
    expect(scheduleSyncMock).toHaveBeenCalledTimes(1);
    // expect(RemoteSyncModuleMock.syncItemsByFolder).toHaveBeenCalledTimes(1);
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
    const props = mockProps<typeof spawnSyncEngineWorker>({ config: { workspaceId } });

    // When
    await spawnSyncEngineWorker(props);

    // Then
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: '[MAIN] Sync engine worker is already starting', workspaceId });
    expect(BrowserWindow).toHaveBeenCalledTimes(0);
    expect(monitorHealthMock).toHaveBeenCalledTimes(0);
    expect(scheduleSyncMock).toHaveBeenCalledTimes(0);
  });

  it('If worker is already running then do nothing', async () => {
    // Given
    workers[workspaceId] = { workerIsRunning: true } as unknown as TWorkerConfig;
    const props = mockProps<typeof spawnSyncEngineWorker>({ config: { workspaceId } });

    // When
    await spawnSyncEngineWorker(props);

    // Then
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: '[MAIN] Sync engine worker is already running', workspaceId });
    expect(BrowserWindow).toHaveBeenCalledTimes(0);
    expect(monitorHealthMock).toHaveBeenCalledTimes(0);
    expect(scheduleSyncMock).toHaveBeenCalledTimes(0);
  });
});
