import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deepMocked, mockProps } from 'tests/vitest/utils.helper.test';
import { fetchFilesByFolder } from './fetch-files-by-folder';

vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('fetch-files-by-folder', () => {
  const getFilesByFolderMock = deepMocked(driveServerWip.folders.getFilesByFolder);
  const getWorkspaceFilesByFolderMock = deepMocked(driveServerWip.workspaces.getFilesByFolder);

  let props: Parameters<typeof fetchFilesByFolder>[0];

  beforeEach(() => {
    props = mockProps<typeof fetchFilesByFolder>({
      folderUuid: 'folderUuid',
      context: {
        abortController: new AbortController(),
        workspaceId: '',
        workspaceToken: '',
      },
    });
  });

  it('Add only files with status EXISTS', async () => {
    // Given
    getFilesByFolderMock.mockResolvedValueOnce({ data: [{ status: 'EXISTS' }, { status: 'DELETED' }] });

    // When
    const files = await fetchFilesByFolder(props);

    // Then
    expect(files).toStrictEqual([{ status: 'EXISTS' }]);
  });

  it('If we fetch less than 50 files, then do not fetch again', async () => {
    // Given
    getFilesByFolderMock.mockResolvedValueOnce({ data: [] });

    // When
    const files = await fetchFilesByFolder(props);

    // Then
    expect(files).toStrictEqual([]);
    expect(getFilesByFolderMock).toHaveBeenCalledTimes(1);
  });

  it('If we fetch 50 files, then fetch again', async () => {
    // Given
    getFilesByFolderMock.mockResolvedValueOnce({ data: Array(50).fill({ status: 'EXISTS' }) });
    getFilesByFolderMock.mockResolvedValueOnce({ data: [] });

    // When
    const files = await fetchFilesByFolder(props);

    // Then
    expect(files).toHaveLength(50);
    expect(getFilesByFolderMock).toHaveBeenCalledTimes(2);
  });

  it('If fetch fails, do not throw an error', async () => {
    // Given
    getFilesByFolderMock.mockResolvedValueOnce({ data: Array(50).fill({ status: 'EXISTS' }) });
    getFilesByFolderMock.mockResolvedValueOnce({ error: new Error() });

    // When
    const files = await fetchFilesByFolder(props);

    // Then
    expect(files).toHaveLength(50);
    expect(getFilesByFolderMock).toHaveBeenCalledTimes(2);
  });

  it('If workspaceId is provided, call fetch from workspace', async () => {
    // Given
    getWorkspaceFilesByFolderMock.mockResolvedValueOnce({ data: [] });
    props.context.workspaceId = 'workspace-id';

    // When
    const files = await fetchFilesByFolder(props);

    // Then
    expect(files).toStrictEqual([]);
    expect(getWorkspaceFilesByFolderMock).toHaveBeenCalledTimes(1);
  });
});
