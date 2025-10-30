import { spawnSyncEngineWorker } from './spawn-sync-engine-worker';
import { mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { WorkerConfig, workers } from '@/apps/main/remote-sync/store';
import { monitorHealth } from './monitor-health';
import { scheduleSync } from './schedule-sync';
import { RecoverySyncModule } from '@/backend/features/sync/recovery-sync/recovery-sync.module';

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

  it('If worker is already running then do nothing', async () => {
    // Given
    workers.set(workspaceId, { workerIsRunning: true } as unknown as WorkerConfig);
    // When
    await spawnSyncEngineWorker(props);
    // Then
    expect(monitorHealthMock).toHaveBeenCalledTimes(1);
    expect(scheduleSyncMock).toHaveBeenCalledTimes(1);
    expect(recoverySyncMock).toHaveBeenCalledTimes(1);
    expect(workers.get(workspaceId)).toStrictEqual(
      expect.objectContaining({
        startingWorker: true,
        syncSchedule: null,
      }),
    );
  });
});
