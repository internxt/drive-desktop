import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { getWorkspaces } from './get-workspaces';
import { PATHS } from '@/core/electron/paths';

vi.mock(import('@/apps/main/util'));

describe('get-workspaces', () => {
  const getWorkspacesMock = deepMocked(driveServerWipModule.workspaces.getWorkspaces);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('If get workspaces gives an error, then return empty array', async () => {
    // Given
    getWorkspacesMock.mockResolvedValueOnce({ error: new Error() });

    // When
    const workspaces = await getWorkspaces();

    // Then
    expect(getWorkspacesMock).toHaveBeenCalledTimes(1);
    expect(workspaces).toStrictEqual([]);
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
    const workspaces = await getWorkspaces();

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
