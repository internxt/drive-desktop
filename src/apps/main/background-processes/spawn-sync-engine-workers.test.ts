import { getMockCalls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as getUserOrThrow from '@/apps/main/auth/service';
import * as getWorkspaces from './sync-engine/services/get-workspaces';
import * as unregisterVirtualDrives from './sync-engine/services/unregister-virtual-drives';
import * as spawnSyncEngineWorker from './sync-engine/services/spawn-sync-engine-worker';
import * as spawnWorkspace from './sync-engine/services/spawn-workspace';
import { spawnSyncEngineWorkers } from './sync-engine';

describe('spawn-sync-engine-workers', () => {
  const getUserOrThrowMock = partialSpyOn(getUserOrThrow, 'getUserOrThrow');
  const getWorkspacesMock = partialSpyOn(getWorkspaces, 'getWorkspaces');
  const unregisterVirtualDrivesMock = partialSpyOn(unregisterVirtualDrives, 'unregisterVirtualDrives');
  const spawnSyncEngineWorkerMock = partialSpyOn(spawnSyncEngineWorker, 'spawnSyncEngineWorker');
  const spawnWorkspaceMock = partialSpyOn(spawnWorkspace, 'spawnWorkspace');

  const props = mockProps<typeof spawnSyncEngineWorkers>({});

  it('should unregister old virtual drives and spawn workers', async () => {
    // Given
    getUserOrThrowMock.mockReturnValue({ uuid: 'user_id' });
    getWorkspacesMock.mockResolvedValue([{ providerId: '{WORKSPACE_ID1}' }, { providerId: '{WORKSPACE_ID2}' }]);
    // When
    await spawnSyncEngineWorkers(props);
    // Then
    expect(spawnSyncEngineWorkerMock).toBeCalledTimes(1);
    expect(spawnWorkspaceMock).toBeCalledTimes(2);
    expect(getMockCalls(unregisterVirtualDrivesMock)).toStrictEqual([
      { currentProviderIds: ['{WORKSPACE_ID1}', '{WORKSPACE_ID2}', '{USER_ID}'] },
    ]);
  });
});
