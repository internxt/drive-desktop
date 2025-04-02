import { deepMocked, getMockCalls, mockProps } from 'tests/vitest/utils.helper.test';
import { spawnWorkspace } from './spawn-workspace';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { logger } from '@/apps/shared/logger/logger';
import { spawnSyncEngineWorker } from './spawn-sync-engine-worker';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { decryptMessageWithPrivateKey } from '@/apps/shared/crypto/service';

vi.mock(import('./spawn-sync-engine-worker'));
vi.mock(import('@/apps/main/auth/service'));
vi.mock(import('@/apps/shared/crypto/service'));
vi.mock(import('@/apps/shared/logger/logger'));
vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));
vi.mock(import('@/apps/main/util'));

describe('spawn-workspace.service', () => {
  const getCredentialsMock = deepMocked(driveServerWipModule.workspaces.getCredentials);
  const decryptMessageWithPrivateKeyMock = vi.mocked(decryptMessageWithPrivateKey);
  const spawnSyncEngineWorkerMock = vi.mocked(spawnSyncEngineWorker);
  const loggerMock = vi.mocked(logger);
  const getUserOrThrowMock = deepMocked(getUserOrThrow);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('If get credentials gives an error, then retry it again', async () => {
    // Given
    getUserOrThrowMock.mockReturnValue({});
    decryptMessageWithPrivateKeyMock.mockResolvedValue('decryptedMnemonic');
    getCredentialsMock
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({
        data: {
          workspaceId: 'workspaceId',
          credentials: {
            networkUser: 'user',
            networkPass: 'pass',
          },
        },
      });

    // When
    const props = mockProps<typeof spawnWorkspace>({
      workspace: {
        id: 'workspaceId',
        providerId: '{PROVIDER_ID}',
        mnemonic: 'encryptedMnemonic',
        rootPath: 'C:\\Users\\user\\InternxtDrive - provider_id',
      },
    });
    await spawnWorkspace(props);

    // Then
    expect(getCredentialsMock).toHaveBeenCalledTimes(5);
    expect(getMockCalls(loggerMock.debug)).toStrictEqual([
      { msg: 'Spawn workspace', workspaceId: 'workspaceId', retry: 1 },
      { msg: 'Spawn workspace', workspaceId: 'workspaceId', retry: 2 },
      { msg: 'Spawn workspace', workspaceId: 'workspaceId', retry: 3 },
      { msg: 'Spawn workspace', workspaceId: 'workspaceId', retry: 4 },
      { msg: 'Spawn workspace', workspaceId: 'workspaceId', retry: 5 },
    ]);
    expect(spawnSyncEngineWorkerMock).toHaveBeenCalledTimes(1);
    expect(spawnSyncEngineWorkerMock).toHaveBeenCalledWith({
      config: {
        bridgePass: 'pass',
        bridgeUser: 'user',
        bucket: undefined,
        loggerPath: undefined,
        mnemonic: 'decryptedMnemonic',
        providerId: '{PROVIDER_ID}',
        providerName: 'Internxt Drive for Business',
        rootPath: 'C:\\Users\\user\\InternxtDrive - provider_id',
        rootUuid: undefined,
        workspaceId: 'workspaceId',
        workspaceToken: undefined,
      },
    });
  });
});
