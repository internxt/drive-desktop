import { deepMocked, mockProps } from 'tests/vitest/utils.helper.test';
import { spawnWorkspace } from './spawn-workspace';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { spawnSyncEngineWorker } from './spawn-sync-engine-worker';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { decryptMessageWithPrivateKey } from '@/apps/shared/crypto/service';

vi.mock(import('./spawn-sync-engine-worker'));
vi.mock(import('@/apps/main/auth/service'));
vi.mock(import('@/apps/shared/crypto/service'));
vi.mock(import('@/apps/main/util'));
vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('spawn-workspace.service', () => {
  const getCredentialsMock = deepMocked(driveServerWipModule.workspaces.getCredentials);
  const decryptMessageWithPrivateKeyMock = vi.mocked(decryptMessageWithPrivateKey);
  const spawnSyncEngineWorkerMock = vi.mocked(spawnSyncEngineWorker);
  const getUserOrThrowMock = deepMocked(getUserOrThrow);

  const props = mockProps<typeof spawnWorkspace>({
    workspace: {
      id: 'workspaceId',
      providerId: '{PROVIDER_ID}',
      mnemonic: 'encryptedMnemonic',
      rootPath: 'C:\\Users\\user\\InternxtDrive - provider_id',
    },
  });

  it('If get credentials gives an error, then do nothing', async () => {
    // Given
    getCredentialsMock.mockResolvedValueOnce({ error: new Error() });

    // When
    await spawnWorkspace(props);

    // Then
    expect(getCredentialsMock).toHaveBeenCalledTimes(1);
    expect(spawnSyncEngineWorkerMock).toHaveBeenCalledTimes(0);
  });

  it('If get credentials success, then spawn sync engine worker', async () => {
    // Given
    getUserOrThrowMock.mockReturnValue({});
    decryptMessageWithPrivateKeyMock.mockResolvedValue('decryptedMnemonic');
    getCredentialsMock.mockResolvedValueOnce({
      data: {
        workspaceId: 'workspaceId',
        credentials: {
          networkUser: 'user',
          networkPass: 'pass',
        },
      },
    });

    // When
    await spawnWorkspace(props);

    // Then
    expect(getCredentialsMock).toHaveBeenCalledTimes(1);
    expect(spawnSyncEngineWorkerMock).toHaveBeenCalledTimes(1);
    expect(spawnSyncEngineWorkerMock).toHaveBeenCalledWith({
      config: {
        bridgePass: 'pass',
        bridgeUser: 'user',
        bucket: undefined,
        loggerPath: '\\mock\\logs\\internxt-drive\\logs\\node-win-workspace-workspaceId.log',
        mnemonic: 'decryptedMnemonic',
        providerId: '{PROVIDER_ID}',
        providerName: 'Internxt Drive for Business',
        queueManagerPath: '\\mock\\logs\\internxt-drive\\logs\\queue-manager-workspace-workspaceId.log',
        rootPath: 'C:\\Users\\user\\InternxtDrive - provider_id',
        rootUuid: undefined,
        workspaceId: 'workspaceId',
        workspaceToken: undefined,
      },
    });
  });
});
