import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deepMocked, mockProps } from 'tests/vitest/utils.helper.test';
import { fetchFoldersByFolder } from './fetch-folders-by-folder';

vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('fetch-folders-by-folder', () => {
  const getFoldersByFolderMock = deepMocked(driveServerWip.folders.getFoldersByFolder);
  const getWorkspaceFoldersByFolderMock = deepMocked(driveServerWip.workspaces.getFoldersByFolder);

  let props: Parameters<typeof fetchFoldersByFolder>[0];

  beforeEach(() => {
    vi.clearAllMocks();

    props = mockProps<typeof fetchFoldersByFolder>({
      folderUuid: 'folderUuid',
      context: {
        workspaceId: '',
        workspaceToken: '',
      },
    });
  });

  it('Add only folders with status EXISTS', async () => {
    // Given
    getFoldersByFolderMock.mockResolvedValueOnce({ data: [{ status: 'EXISTS' }, { status: 'DELETED' }] });

    // When
    const folders = await fetchFoldersByFolder(props);

    // Then
    expect(folders).toStrictEqual([{ status: 'EXISTS' }]);
  });

  it('If we fetch less than 50 folders, then do not fetch again', async () => {
    // Given
    getFoldersByFolderMock.mockResolvedValueOnce({ data: [] });

    // When
    const folders = await fetchFoldersByFolder(props);

    // Then
    expect(folders).toStrictEqual([]);
    expect(getFoldersByFolderMock).toHaveBeenCalledTimes(1);
  });

  it('If we fetch 50 folders, then fetch again', async () => {
    // Given
    getFoldersByFolderMock.mockResolvedValueOnce({ data: Array(50).fill({ status: 'EXISTS' }) });
    getFoldersByFolderMock.mockResolvedValueOnce({ data: [] });

    // When
    const folders = await fetchFoldersByFolder(props);

    // Then
    expect(folders).toHaveLength(50);
    expect(getFoldersByFolderMock).toHaveBeenCalledTimes(2);
  });

  it('If fetch fails, do not throw an error', async () => {
    // Given
    getFoldersByFolderMock.mockResolvedValueOnce({ data: Array(50).fill({ status: 'EXISTS' }) });
    getFoldersByFolderMock.mockResolvedValueOnce({ error: new Error() });

    // When
    const folders = await fetchFoldersByFolder(props);

    // Then
    expect(folders).toHaveLength(50);
    expect(getFoldersByFolderMock).toHaveBeenCalledTimes(2);
  });

  it('If workspaceId is provided, call fetch from workspace', async () => {
    // Given
    getWorkspaceFoldersByFolderMock.mockResolvedValueOnce({ data: [] });
    props.context.workspaceId = 'workspace-id';

    // When
    const files = await fetchFoldersByFolder(props);

    // Then
    expect(files).toStrictEqual([]);
    expect(getWorkspaceFoldersByFolderMock).toHaveBeenCalledTimes(1);
  });
});
