import { mockProps } from 'tests/vitest/utils.helper.test';
import { sleep } from '@/apps/main/util';
import { spawnWorkspace } from './spawn-workspace.service';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { logger } from '@/apps/shared/logger/logger';
import { spawnSyncEngineWorker } from './spawn-sync-engine-worker.service';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { decryptMessageWithPrivateKey } from '@/apps/shared/crypto/service';

vi.mock('./spawn-sync-engine-worker.service');
vi.mock('@/apps/main/auth/service');
vi.mock('@/apps/shared/crypto/service');
vi.mock('@/apps/shared/logger/logger');
vi.mock('@/infra/drive-server-wip/drive-server-wip.module');

describe('spawn-workspace.service', () => {
  const driveServerWipMock = vi.mocked(driveServerWipModule.workspaces);
  const loggerMock = vi.mocked(logger);
  const spawnSyncEngineWorkerMock = vi.mocked(spawnSyncEngineWorker);
  const getUserOrThrowMock = vi.mocked(getUserOrThrow);
  const decryptMessageWithPrivateKeyMock = vi.mocked(decryptMessageWithPrivateKey);

  const workspaceId = 'workspaceId';
  const mnemonic = 'mnemonic';

  beforeAll(() => {
    vi.spyOn(global, 'setTimeout').mockImplementation((cb) => cb() as unknown as ReturnType<typeof setTimeout>);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('If get credentials gives an error, then retry it again', async () => {
    // Given
    driveServerWipMock.getCredentials
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() });

    const props = mockProps<typeof spawnWorkspace>({ workspace: { id: workspaceId, mnemonic } });

    // When
    await spawnWorkspace(props);
    await sleep(50);

    // Then
    expect(driveServerWipMock.getCredentials).toHaveBeenCalledTimes(5);
    expect(loggerMock.debug).toHaveBeenCalledTimes(5);
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspace', workspaceId, retry: 1 });
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspace', workspaceId, retry: 2 });
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspace', workspaceId, retry: 3 });
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspace', workspaceId, retry: 4 });
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspace', workspaceId, retry: 5 });
  });

  it('If get credentials success, then spawn sync engine worker', async () => {
    // Given
    // @ts-expect-error TODO: add DeepPartial here
    getUserOrThrowMock.mockReturnValue({});
    decryptMessageWithPrivateKeyMock.mockResolvedValue(mnemonic);
    driveServerWipMock.getCredentials.mockResolvedValueOnce({
      // @ts-expect-error TODO: add DeepPartial here
      data: {
        workspaceId,
        credentials: {
          networkUser: 'user',
          networkPass: 'pass',
        },
      },
    });

    const props = mockProps<typeof spawnWorkspace>({ workspace: { id: workspaceId, mnemonic } });

    // When
    await spawnWorkspace(props);

    // Then
    expect(spawnSyncEngineWorkerMock).toHaveBeenCalledTimes(1);
    expect(spawnSyncEngineWorkerMock).toHaveBeenCalledWith({
      config: {
        bridgePass: 'pass',
        bridgeUser: 'user',
        bucket: undefined,
        loggerPath: undefined,
        mnemonic: 'mnemonic',
        providerId: '{workspaceId}',
        providerName: 'Internxt Drive for Business',
        rootPath: {
          lastSavedListing: '/mock/logs',
          logEnginePath: '/mock/logs',
          logWatcherPath: '/mock/logs',
          persistQueueManagerPath: '/mock/logs',
          syncRoot: '/mock/path',
        },
        rootUuid: undefined,
        workspaceId: 'workspaceId',
        workspaceToken: undefined,
      },
    });
  });
});
