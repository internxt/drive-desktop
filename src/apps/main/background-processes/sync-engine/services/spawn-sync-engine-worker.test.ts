import { spawnSyncEngineWorker } from './spawn-sync-engine-worker';
import { mockProps } from 'tests/vitest/utils.helper.test';
import { workers } from '../store';
import { BrowserWindow } from 'electron';
import { monitorHealth } from './monitor-health';
import { logger } from '@/apps/shared/logger/logger';
import { scheduleSync } from './schedule-sync';

vi.mock(import('./stop-and-clear-sync-engine-worker'));
vi.mock(import('./monitor-health'));
vi.mock(import('./schedule-sync'));
vi.mock(import('@/apps/shared/logger/logger'));

describe('spawn-sync-engine-worker', () => {
  const monitorHealthMock = vi.mocked(monitorHealth);
  const loggerMock = vi.mocked(logger);
  const scheduleSyncMock = vi.mocked(scheduleSync);

  const workspaceId = 'workspaceId';

  beforeEach(() => {
    delete workers[workspaceId];
    vi.clearAllMocks();
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
    workers[workspaceId] = { workerIsRunning: true } as any;
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
