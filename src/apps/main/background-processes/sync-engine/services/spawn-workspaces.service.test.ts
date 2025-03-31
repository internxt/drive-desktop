vi.mock('./spawn-workspace.service');
vi.mock('@/apps/shared/logger/logger');
vi.mock('@/infra/drive-server-wip/drive-server-wip.module');

import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { mockProps } from 'tests/vitest/utils.helper.test';
import { logger } from '@/apps/shared/logger/logger';
import { sleep } from '@/apps/main/util';
import { spawnWorkspace } from './spawn-workspace.service';
import { spawnWorkspaces } from './spawn-workspaces.service';

describe('spawn-workspaces.service', () => {
  const driveServerWipMock = vi.mocked(driveServerWipModule.workspaces);
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
    driveServerWipMock.getWorkspaces
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() });

    const props = mockProps<typeof spawnWorkspaces>({});

    // When
    await spawnWorkspaces(props);
    await sleep(50);

    // Then
    expect(driveServerWipMock.getWorkspaces).toHaveBeenCalledTimes(5);
    expect(loggerMock.debug).toHaveBeenCalledTimes(5);
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 1 });
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 2 });
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 3 });
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 4 });
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Spawn workspaces', retry: 5 });
  });

  it('If get workspaces success, then spawn workspaces', async () => {
    // Given
    driveServerWipMock.getWorkspaces.mockResolvedValue({
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

    const props = mockProps<typeof spawnWorkspaces>({});

    // When
    await spawnWorkspaces(props);
    await sleep(50);

    // Then
    expect(driveServerWipMock.getWorkspaces).toHaveBeenCalledTimes(1);
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
