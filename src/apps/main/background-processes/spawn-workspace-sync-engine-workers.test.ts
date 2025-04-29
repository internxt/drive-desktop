import { deepMocked, getMockCalls } from 'tests/vitest/utils.helper.test';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { spawnWorkspaceSyncEngineWorkers } from './sync-engine';
import { getWorkspaces } from './sync-engine/services/get-workspaces';
import { spawnWorkspace } from './sync-engine/services/spawn-workspace';
import { unregisterVirtualDrives } from './sync-engine/services/unregister-virtual-drives';

vi.mock(import('@/apps/main/auth/service'));
vi.mock(import('./sync-engine/services/get-workspaces'));
vi.mock(import('./sync-engine/services/spawn-workspace'));
vi.mock(import('./sync-engine/services/unregister-virtual-drives'));

describe('spawn-workspace-sync-engine-workers', () => {
  const getUserOrThrowMock = deepMocked(getUserOrThrow);
  const getWorkspacesMock = deepMocked(getWorkspaces);
  const spawnWorkspaceMock = vi.mocked(spawnWorkspace);
  const unregisterVirtualDrivesMock = vi.mocked(unregisterVirtualDrives);

  it('Spawn workspaces and main sync engine worker', async () => {
    // Given
    getUserOrThrowMock.mockReturnValue({ uuid: 'user_id' });
    getWorkspacesMock.mockResolvedValue([{ providerId: '{WORKSPACE_PROVIDER_ID}' }]);

    // When
    await spawnWorkspaceSyncEngineWorkers({ providerId: '{PROVIDER_ID}' });

    // Then
    expect(getMockCalls(spawnWorkspaceMock)).toStrictEqual([{ workspace: { providerId: '{WORKSPACE_PROVIDER_ID}' } }]);
    expect(getMockCalls(unregisterVirtualDrivesMock)).toStrictEqual([{ currentProviderIds: ['{WORKSPACE_PROVIDER_ID}', '{PROVIDER_ID}'] }]);
  });
});
