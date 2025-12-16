import { spawnSyncEngineWorker } from './spawn-sync-engine-worker';
import { call, calls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { workers } from '@/apps/main/remote-sync/store';
import { monitorHealth } from './monitor-health';
import { scheduleSync } from './schedule-sync';
import { RecoverySyncModule } from '@/backend/features/sync/recovery-sync/recovery-sync.module';
import { Addon } from '@/node-win/addon-wrapper';
import * as addSyncIssue from '../../issues';
import * as refreshItemPlaceholders from '@/apps/sync-engine/refresh-item-placeholders';
import { VirtualDrive } from '@/node-win/virtual-drive';
import * as initWatcher from '@/node-win/watcher/watcher';
import * as addPendingItems from '@/apps/sync-engine/in/add-pending-items';

vi.mock(import('./stop-sync-engine-worker'));
vi.mock(import('./monitor-health'));
vi.mock(import('./schedule-sync'));

describe('spawn-sync-engine-worker', () => {
  const createSyncRootFolderMock = partialSpyOn(VirtualDrive, 'createSyncRootFolder');
  const registerSyncRootMock = partialSpyOn(Addon, 'registerSyncRoot');
  const addSyncIssueMock = partialSpyOn(addSyncIssue, 'addSyncIssue');
  const monitorHealthMock = vi.mocked(monitorHealth);
  const scheduleSyncMock = vi.mocked(scheduleSync);
  const recoverySyncMock = partialSpyOn(RecoverySyncModule, 'recoverySync');
  const refreshItemPlaceholdersMock = partialSpyOn(refreshItemPlaceholders, 'refreshItemPlaceholders');
  const initWatcherMock = partialSpyOn(initWatcher, 'initWatcher');
  const addPendingItemsMock = partialSpyOn(addPendingItems, 'addPendingItems');

  const workspaceId = 'workspaceId';
  const props = mockProps<typeof spawnSyncEngineWorker>({ ctx: { workspaceId } });

  beforeEach(() => {
    workers.clear();
  });

  it('should add issue if register sync root fails', async () => {
    // Given
    registerSyncRootMock.mockRejectedValue(new Error('message'));
    // When
    await spawnSyncEngineWorker(props);
    // Then
    call(addSyncIssueMock).toMatchObject({ error: 'CANNOT_REGISTER_VIRTUAL_DRIVE' });
  });

  it('should start sync engine process if register sync root success', async () => {
    // Given
    registerSyncRootMock.mockResolvedValue(undefined);
    // When
    await spawnSyncEngineWorker(props);
    // Then
    calls(addSyncIssueMock).toHaveLength(0);
    calls(createSyncRootFolderMock).toHaveLength(1);
    calls(refreshItemPlaceholdersMock).toHaveLength(1);
    calls(monitorHealthMock).toHaveLength(1);
    calls(scheduleSyncMock).toHaveLength(1);
    calls(recoverySyncMock).toHaveLength(1);
    calls(initWatcherMock).toHaveLength(1);
    calls(addPendingItemsMock).toHaveLength(1);
    expect(workers.get(workspaceId)).toBeDefined();
  });
});
