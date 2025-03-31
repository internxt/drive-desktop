import { mockDeep } from 'vitest-mock-extended';
import { SpawnWorkspaceService } from './spawn-workspace.service';
import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { mockProps } from 'tests/vitest/utils.helper.test';
import { SpawnSyncEngineWorkerService } from './spawn-sync-engine-worker.service';
import { LoggerService } from '@/apps/shared/logger/logger';
import { sleep } from '@/apps/main/util';
import { GetUserService } from '@/apps/main/auth/get-user.service';
import { CryptoService } from '@/apps/shared/crypto/crypto.service';

describe('spawn-workspace.service', () => {
  const driveServerWip = mockDeep<DriveServerWipModule>();
  const spawnSyncEngineWorker = mockDeep<SpawnSyncEngineWorkerService>();
  const logger = mockDeep<LoggerService>();
  const getUser = mockDeep<GetUserService>();
  const crypto = mockDeep<CryptoService>();
  const service = new SpawnWorkspaceService(driveServerWip, spawnSyncEngineWorker, logger, getUser, crypto);

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
    driveServerWip.workspaces.getCredentials
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() });

    const props = mockProps<typeof service.run>({ workspace: { id: workspaceId, mnemonic } });

    // When
    await service.run(props);
    await sleep(50);

    // Then
    expect(driveServerWip.workspaces.getCredentials).toHaveBeenCalledTimes(5);
    expect(logger.debug).toHaveBeenCalledTimes(5);
    expect(logger.debug).toHaveBeenCalledWith({ msg: 'Spawn workspace', workspaceId, retry: 1 });
    expect(logger.debug).toHaveBeenCalledWith({ msg: 'Spawn workspace', workspaceId, retry: 2 });
    expect(logger.debug).toHaveBeenCalledWith({ msg: 'Spawn workspace', workspaceId, retry: 3 });
    expect(logger.debug).toHaveBeenCalledWith({ msg: 'Spawn workspace', workspaceId, retry: 4 });
    expect(logger.debug).toHaveBeenCalledWith({ msg: 'Spawn workspace', workspaceId, retry: 5 });
  });

  it('If get credentials success, then spawn sync engine worker', async () => {
    // Given
    // @ts-expect-error TODO: add DeepPartial here
    getUser.getOrThrow.mockReturnValue({});
    crypto.decryptMessageWithPrivateKey.mockResolvedValue(mnemonic);
    driveServerWip.workspaces.getCredentials.mockResolvedValueOnce({
      // @ts-expect-error TODO: add DeepPartial here
      data: {
        workspaceId,
        credentials: {
          networkUser: 'user',
          networkPass: 'pass',
        },
      },
    });

    const props = mockProps<typeof service.run>({ workspace: { id: workspaceId, mnemonic } });

    // When
    await service.run(props);

    // Then
    expect(spawnSyncEngineWorker.run).toHaveBeenCalledTimes(1);
    expect(spawnSyncEngineWorker.run).toHaveBeenCalledWith({
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
