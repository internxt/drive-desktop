import { deepMocked, getMockCalls } from 'tests/vitest/utils.helper.test';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { spawnDefaultSyncEngineWorker } from './sync-engine';
import { spawnSyncEngineWorker } from './sync-engine/services/spawn-sync-engine-worker';

vi.mock(import('@/apps/main/auth/service'));
vi.mock(import('./sync-engine/services/spawn-sync-engine-worker'));

describe('spawn-default-sync-engine-worker', () => {
  const getUserOrThrowMock = deepMocked(getUserOrThrow);
  const spawnSyncEngineWorkerMock = vi.mocked(spawnSyncEngineWorker);

  it('Spawn default sync engine worker', async () => {
    // Given
    getUserOrThrowMock.mockReturnValue({ uuid: 'user_id' });

    // When
    await spawnDefaultSyncEngineWorker();

    // Then
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
          queueManagerPath: '\\mock\\logs\\internxt-drive\\logs\\queue-manager-user-user_id.log',
          rootPath: '/mock/path',
          rootUuid: undefined,
          userUuid: 'user_id',
          workspaceId: '',
          workspaceToken: '',
        },
      },
    ]);
  });
});
