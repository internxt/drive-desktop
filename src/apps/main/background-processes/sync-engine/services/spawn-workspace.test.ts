import { call, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { spawnWorkspace } from './spawn-workspace';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import * as spawnSyncEngineWorker from './spawn-sync-engine-worker';
import * as getUserOrThrow from '@/apps/main/auth/service';
import * as decryptMessageWithPrivateKey from '@/apps/shared/crypto/service';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

describe('spawn-workspace.service', () => {
  const getCredentialsMock = partialSpyOn(driveServerWipModule.workspaces, 'getCredentials');
  const decryptMessageWithPrivateKeyMock = partialSpyOn(decryptMessageWithPrivateKey, 'decryptMessageWithPrivateKey');
  const spawnSyncEngineWorkerMock = partialSpyOn(spawnSyncEngineWorker, 'spawnSyncEngineWorker');
  const getUserOrThrowMock = partialSpyOn(getUserOrThrow, 'getUserOrThrow');

  const props = mockProps<typeof spawnWorkspace>({
    ctx: { abortController: new AbortController() },
    workspace: {
      id: 'workspaceId',
      providerId: '{PROVIDER_ID}',
      key: 'encryptedMnemonic',
      rootPath: 'C:/Users/user/InternxtDrive - provider_id' as AbsolutePath,
    },
  });

  beforeEach(() => {
    getCredentialsMock.mockResolvedValue({
      data: {
        workspaceId: 'workspaceId',
        credentials: {
          networkUser: 'user',
          networkPass: 'pass',
        },
      },
    });
    getUserOrThrowMock.mockReturnValue({});
    decryptMessageWithPrivateKeyMock.mockResolvedValue('decryptedMnemonic');
  });

  it('If get credentials gives an error, then do nothing', async () => {
    // Given
    getCredentialsMock.mockResolvedValue({ error: new Error() });
    // When
    await spawnWorkspace(props);
    // Then
    expect(getCredentialsMock).toHaveBeenCalledTimes(1);
    expect(spawnSyncEngineWorkerMock).toHaveBeenCalledTimes(0);
  });

  it('If decrypt throws an error, capture it', async () => {
    // Given
    decryptMessageWithPrivateKeyMock.mockRejectedValue(new Error());
    // When
    await spawnWorkspace(props);
    // Then
    expect(loggerMock.error).toBeCalledTimes(1);
  });

  it('If get credentials success, then spawn sync engine worker', async () => {
    // When
    await spawnWorkspace(props);
    // Then
    expect(getCredentialsMock).toHaveBeenCalledTimes(1);
    call(spawnSyncEngineWorkerMock).toMatchObject({
      ctx: {
        bridgePass: 'pass',
        bridgeUser: 'user',
        bucket: undefined,
        mnemonic: 'decryptedMnemonic',
        providerId: '{PROVIDER_ID}',
        providerName: 'Internxt Drive for Business',
        rootPath: 'C:/Users/user/InternxtDrive - provider_id',
        rootUuid: undefined,
        workspaceId: 'workspaceId',
        workspaceToken: undefined,
      },
    });
  });
});
