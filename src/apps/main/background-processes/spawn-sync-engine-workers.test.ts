import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as getWorkspaces from './sync-engine/services/get-workspaces';
import * as unregisterVirtualDrives from './sync-engine/services/unregister-virtual-drives';
import * as spawnSyncEngineWorker from './sync-engine/services/spawn-sync-engine-worker';
import * as spawnWorkspace from './sync-engine/services/spawn-workspace';
import { spawnSyncEngineWorkers } from './sync-engine';
import * as getRootVirtualDrive from '../virtual-root-folder/service';

describe('spawn-sync-engine-workers', () => {
  partialSpyOn(getRootVirtualDrive, 'getRootVirtualDrive');
  const getWorkspacesMock = partialSpyOn(getWorkspaces, 'getWorkspaces');
  const unregisterVirtualDrivesMock = partialSpyOn(unregisterVirtualDrives, 'unregisterVirtualDrives');
  const spawnSyncEngineWorkerMock = partialSpyOn(spawnSyncEngineWorker, 'spawnSyncEngineWorker');
  const spawnWorkspaceMock = partialSpyOn(spawnWorkspace, 'spawnWorkspace');

  const props = mockProps<typeof spawnSyncEngineWorkers>({
    ctx: { user: { uuid: 'user_id' } },
  });

  it('should unregister old virtual drives and spawn workers', async () => {
    // Given
    getWorkspacesMock.mockResolvedValue([{ providerId: '{WORKSPACE_ID1}' }, { providerId: '{WORKSPACE_ID2}' }]);
    // When
    await spawnSyncEngineWorkers(props);
    // Then
    calls(spawnSyncEngineWorkerMock).toHaveLength(1);
    calls(spawnWorkspaceMock).toHaveLength(2);
    call(unregisterVirtualDrivesMock).toStrictEqual({
      currentProviderIds: ['{WORKSPACE_ID1}', '{WORKSPACE_ID2}', '{USER_ID}'],
    });
  });
});
