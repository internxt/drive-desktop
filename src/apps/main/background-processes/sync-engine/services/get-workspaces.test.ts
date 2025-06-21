import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deepMocked, getMockCalls, mockProps } from 'tests/vitest/utils.helper.test';
import { getWorkspaces } from './get-workspaces';
import { PATHS } from '@/core/electron/paths';
import { loggerMock } from 'tests/vitest/mocks.helper.test';

vi.mock(import('@/apps/main/util'));

describe('get-workspaces', () => {
  const getWorkspacesMock = deepMocked(driveServerWipModule.workspaces.getWorkspaces);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('If get workspaces gives an error, then retry it again', async () => {
    // Given
    getWorkspacesMock
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ error: new Error() })
      .mockResolvedValueOnce({ data: { availableWorkspaces: [] } });

    // When
    const props = mockProps<typeof getWorkspaces>({});
    await getWorkspaces(props);

    // Then
    expect(getWorkspacesMock).toHaveBeenCalledTimes(5);
    expect(getMockCalls(loggerMock.debug)).toStrictEqual([
      { msg: 'Get workspaces', retry: 1 },
      { msg: 'Get workspaces', retry: 2 },
      { msg: 'Get workspaces', retry: 3 },
      { msg: 'Get workspaces', retry: 4 },
      { msg: 'Get workspaces', retry: 5 },
    ]);
  });

  it('If get workspaces success, then spawn workspaces', async () => {
    // Given
    PATHS.HOME_FOLDER_PATH = 'C:\\Users\\user';
    getWorkspacesMock.mockResolvedValue({
      data: {
        availableWorkspaces: [
          {
            workspace: { id: 'workspaceId' },
            workspaceUser: {
              id: 'provider_id',
              key: 'mnemonic',
              rootFolderId: 'rootFolderId',
            },
          },
        ],
      },
    });

    // When
    const props = mockProps<typeof getWorkspaces>({});
    const workspaces = await getWorkspaces(props);

    // Then
    expect(getWorkspacesMock).toHaveBeenCalledTimes(1);
    expect(workspaces).toStrictEqual([
      {
        id: 'workspaceId',
        providerId: '{PROVIDER_ID}',
        mnemonic: 'mnemonic',
        rootFolderId: 'rootFolderId',
        rootPath: 'C:\\Users\\user\\InternxtDrive - provider_id',
      },
    ]);
  });
});
