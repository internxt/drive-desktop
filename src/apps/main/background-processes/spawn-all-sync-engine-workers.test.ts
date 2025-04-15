import { deepMocked, getMockCalls } from 'tests/vitest/utils.helper.test';
import { getUser } from '@/apps/main/auth/service';
import { spawnAllSyncEngineWorker } from './sync-engine';
import { getWorkspaces } from './sync-engine/services/get-workspaces';
import { spawnWorkspace } from './sync-engine/services/spawn-workspace';
import { spawnSyncEngineWorker } from './sync-engine/services/spawn-sync-engine-worker';

vi.mock(import('@/apps/main/auth/service'));
vi.mock(import('./sync-engine/services/get-workspaces'));
vi.mock(import('./sync-engine/services/spawn-workspace'));
vi.mock(import('./sync-engine/services/spawn-sync-engine-worker'));

describe('spawn-all-sync-engine-workers', () => {
  const getUserMock = deepMocked(getUser);
  const getWorkspacesMock = deepMocked(getWorkspaces);
  const spawnWorkspaceMock = vi.mocked(spawnWorkspace);
  const spawnSyncEngineWorkerMock = vi.mocked(spawnSyncEngineWorker);

  it('Spawn workspaces and main sync engine worker', async () => {
    // Given
    getUserMock.mockReturnValue({ uuid: 'user_id' });
    getWorkspacesMock.mockResolvedValue([{ providerId: '{WORKSPACE_PROVIDER_ID}' }]);

    // When
    await spawnAllSyncEngineWorker();

    // Then
    expect(getMockCalls(spawnWorkspaceMock)).toStrictEqual([{ workspace: { providerId: '{WORKSPACE_PROVIDER_ID}' } }]);
    expect(getMockCalls(spawnSyncEngineWorkerMock)).toStrictEqual([
      {
        config: {
          bridgePass: undefined,
          bridgeUser: undefined,
          bucket: undefined,
          loggerPath: '\\mock\\logs\\internxt-drive\\logs\\node-win.log',
          mnemonic: undefined,
          providerId: '{USER_ID}',
          providerName: 'Internxt Drive',
          rootPath: '/mock/path',
          rootUuid: undefined,
          workspaceId: '',
          workspaceToken: undefined,
        },
      },
    ]);
  });
});
