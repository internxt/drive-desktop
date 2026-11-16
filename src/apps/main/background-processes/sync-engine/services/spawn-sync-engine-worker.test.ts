import { call, calls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as syncManager from '@/apps/main/remote-sync/RemoteSyncManager';
import { workers } from '@/apps/main/remote-sync/store';
import * as addPendingItems from '@/apps/sync-engine/in/add-pending-items';
import * as refreshItemPlaceholders from '@/apps/sync-engine/refresh-item-placeholders';
import * as sync from '@/backend/features/sync';
import { RecoverySyncModule } from '@/backend/features/sync/recovery-sync/recovery-sync.module';
import * as initWatcher from '@/node-win/watcher/watcher';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import * as loadVirtualDrive from './load-virtual-drive';
import * as scheduleSync from './schedule-sync';
import { spawnSyncEngineWorker } from './spawn-sync-engine-worker';

describe('spawn-sync-engine-worker', () => {
  const loadVirtualDriveMock = partialSpyOn(loadVirtualDrive, 'loadVirtualDrive');
  const scheduleSyncMock = partialSpyOn(scheduleSync, 'scheduleSync');
  const recoverySyncMock = partialSpyOn(RecoverySyncModule, 'recoverySync');
  const refreshItemPlaceholdersMock = partialSpyOn(refreshItemPlaceholders, 'refreshItemPlaceholders');
  const initWatcherMock = partialSpyOn(initWatcher, 'initWatcher');
  const addPendingItemsMock = partialSpyOn(addPendingItems, 'addPendingItems');
  const shouldResumeRecoveryMock = partialSpyOn(sync, 'shouldResumeRecovery');
  const changeSyncStatusMock = partialSpyOn(syncManager, 'changeSyncStatus');

  const workspaceId = 'workspaceId';
  const props = mockProps<typeof spawnSyncEngineWorker>({ ctx: { workspaceId } });

  beforeEach(() => {
    workers.clear();
    shouldResumeRecoveryMock.mockReturnValue(false);
  });

  it('should catch errors', async () => {
    // Given
    loadVirtualDriveMock.mockRejectedValue(new Error());
    // When
    await spawnSyncEngineWorker(props);
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error loading sync engine worker' });
  });

  it('should skip if load virtual drive fails', async () => {
    // Given
    loadVirtualDriveMock.mockResolvedValue(undefined);
    // When
    await spawnSyncEngineWorker(props);
    // Then
    calls(loggerMock.error).toHaveLength(0);
    calls(refreshItemPlaceholdersMock).toHaveLength(0);
  });

  it('should start sync engine process if load virtual drive success', async () => {
    // Given
    loadVirtualDriveMock.mockResolvedValue(1n);
    // When
    await spawnSyncEngineWorker(props);
    // Then
    calls(loggerMock.error).toHaveLength(0);
    calls(refreshItemPlaceholdersMock).toHaveLength(1);
    calls(scheduleSyncMock).toHaveLength(1);
    calls(recoverySyncMock).toHaveLength(0);
    calls(initWatcherMock).toHaveLength(1);
    calls(addPendingItemsMock).toHaveLength(1);
    calls(changeSyncStatusMock).toHaveLength(0);
    expect(workers.get(workspaceId)).toBeDefined();
  });

  it('should hold back sync and the placeholder refresh when a recovery was interrupted', async () => {
    // Given
    loadVirtualDriveMock.mockResolvedValue(1n);
    shouldResumeRecoveryMock.mockReturnValue(true);
    // When
    await spawnSyncEngineWorker(props);
    // Then
    call(changeSyncStatusMock).toMatchObject({ status: 'SYNCING' });
    expect(changeSyncStatusMock.mock.invocationCallOrder[0]).toBeLessThan(scheduleSyncMock.mock.invocationCallOrder[0]);
    calls(refreshItemPlaceholdersMock).toHaveLength(0);
    calls(initWatcherMock).toHaveLength(1);
  });
});
