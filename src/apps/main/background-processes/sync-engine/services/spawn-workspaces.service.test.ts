import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deepMocked, mockProps } from 'tests/vitest/utils.helper.test';
import { logger } from '@/apps/shared/logger/logger';
import { sleep } from '@/apps/main/util';
import { spawnWorkspace } from './spawn-workspace.service';
import { spawnWorkspaces } from './spawn-workspaces.service';

vi.mock('./spawn-workspace.service');
vi.mock('@/apps/shared/logger/logger');
vi.mock('@/infra/drive-server-wip/drive-server-wip.module');

describe('spawn-workspaces.service', () => {
  const getWorkspacesMock = deepMocked(driveServerWipModule.workspaces.getWorkspaces);
  const loggerMock = vi.mocked(logger);
  const spawnWorkspaceMock = vi.mocked(spawnWorkspace);

  beforeAll(() => {
    vi.spyOn(global, 'setTimeout').mockImplementation((cb) => cb() as unknown as ReturnType<typeof setTimeout>);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('If get workspaces gives an error, then retry it again', async () => {
    // Given
    getWorkspacesMock
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() });

    const props = mockProps<typeof spawnWorkspaces>({});

    // When
    await spawnWorkspaces(props);
    await sleep(50);

    // Then
    expect(getWorkspacesMock).toHaveBeenCalledTimes(5);
    expect(loggerMock.debug).toHaveBeenCalledTimes(5);
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 1 });
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 2 });
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 3 });
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 4 });
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 5 });
  });

  it('If get workspaces success, then spawn workspaces', async () => {
    // Given
    getWorkspacesMock.mockResolvedValue({
      data: {
        availableWorkspaces: [
          {
            workspace: {
              id: 'workspaceId',
            },
            workspaceUser: {
              key: 'key',
              rootFolderId: 'rootFolderId',
            },
          },
        ],
      },
    });

    const props = mockProps<typeof spawnWorkspaces>({});

    // When
    await spawnWorkspaces(props);
    await sleep(50);

    // Then
    expect(getWorkspacesMock).toHaveBeenCalledTimes(1);
    expect(spawnWorkspaceMock).toHaveBeenCalledTimes(1);
    expect(spawnWorkspaceMock).toHaveBeenCalledWith({
      workspace: {
        id: 'workspaceId',
        mnemonic: 'key',
        rootFolderId: 'rootFolderId',
      },
    });
  });
});
