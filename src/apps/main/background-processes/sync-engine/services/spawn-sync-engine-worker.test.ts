import { spawnSyncEngineWorker } from './spawn-sync-engine-worker';
import { mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { BrowserWindow } from 'electron';
import { monitorHealth } from './monitor-health';
import { scheduleSync } from './schedule-sync';
import { RecoverySyncModule } from '@/backend/features/sync/recovery-sync/recovery-sync.module';
import { workers } from '@/apps/main/remote-sync/store';

vi.mock(import('./stop-sync-engine-worker'));
vi.mock(import('./monitor-health'));
vi.mock(import('./schedule-sync'));

describe('spawn-sync-engine-worker', () => {
  const monitorHealthMock = vi.mocked(monitorHealth);
  const scheduleSyncMock = vi.mocked(scheduleSync);
  const recoverySyncMock = partialSpyOn(RecoverySyncModule, 'recoverySync');

  const workspaceId = 'workspaceId';
  const props = mockProps<typeof spawnSyncEngineWorker>({ ctx: { workspaceId } });

  beforeEach(() => {
    workers.clear();
  });

  it('If worker does not exist then create and start it', async () => {
    // When
    await spawnSyncEngineWorker(props);
    // Then
    expect(BrowserWindow).toHaveBeenCalledTimes(1);
    expect(monitorHealthMock).toHaveBeenCalledTimes(1);
    expect(scheduleSyncMock).toHaveBeenCalledTimes(1);
    expect(recoverySyncMock).toHaveBeenCalledTimes(1);
    expect(workers.get(workspaceId)).toStrictEqual(
      expect.objectContaining({
        startingWorker: true,
        syncSchedule: null,
        workerIsRunning: false,
        worker: expect.anything(),
      }),
    );
  });
});
