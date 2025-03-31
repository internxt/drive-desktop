import { mockDeep } from 'vitest-mock-extended';
import { SpawnWorkspacesService } from './spawn-workspaces.service';
import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { mockProps } from 'tests/vitest/utils.helper.test';
import { SpawnWorkspaceService } from './spawn-workspace.service';
import { LoggerService } from '@/apps/shared/logger/logger';
import { sleep } from '@/apps/main/util';

describe('spawn-workspaces.service', () => {
  const driveServerWip = mockDeep<DriveServerWipModule>();
  const spawnWorkspace = mockDeep<SpawnWorkspaceService>();
  const logger = mockDeep<LoggerService>();
  const service = new SpawnWorkspacesService(driveServerWip, spawnWorkspace, logger);

  beforeAll(() => {
    vi.spyOn(global, 'setTimeout').mockImplementation((cb) => cb() as unknown as ReturnType<typeof setTimeout>);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('If get workspaces gives an error, then retry it again', async () => {
    // Given
    driveServerWip.workspaces.getWorkspaces
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() });

    const props = mockProps<typeof service.run>({});

    // When
    await service.run(props);
    await sleep(50);

    // Then
    expect(driveServerWip.workspaces.getWorkspaces).toHaveBeenCalledTimes(5);
    expect(logger.debug).toHaveBeenCalledTimes(5);
    expect(logger.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 1 });
    expect(logger.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 2 });
    expect(logger.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 3 });
    expect(logger.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 4 });
    expect(logger.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 5 });
  });

  it('If get workspaces success, then spawn workspaces', async () => {
    // Given
    driveServerWip.workspaces.getWorkspaces.mockResolvedValue({
      data: {
        availableWorkspaces: [
          {
            // @ts-expect-error TODO add DeepPartial
            workspace: {
              id: 'workspaceId',
            },
            // @ts-expect-error TODO add DeepPartial
            workspaceUser: {
              key: 'key',
              rootFolderId: 'rootFolderId',
            },
          },
        ],
      },
    });

    const props = mockProps<typeof service.run>({});

    // When
    await service.run(props);
    await sleep(50);

    // Then
    expect(driveServerWip.workspaces.getWorkspaces).toHaveBeenCalledTimes(1);
    expect(spawnWorkspace.run).toHaveBeenCalledTimes(1);
    expect(spawnWorkspace.run).toHaveBeenCalledWith({
      workspace: {
        id: 'workspaceId',
        mnemonic: 'key',
        rootFolderId: 'rootFolderId',
      },
    });
  });
});
