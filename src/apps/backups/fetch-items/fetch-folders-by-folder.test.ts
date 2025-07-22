import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deepMocked, mockProps } from 'tests/vitest/utils.helper.test';
import { fetchFoldersByFolder } from './fetch-folders-by-folder';

vi.mock(import('@/apps/main/util'));
vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('fetch-folders-by-folder', () => {
  const getFoldersByFolderMock = deepMocked(driveServerWip.folders.getFoldersByFolder);

  let props: Parameters<typeof fetchFoldersByFolder>[0];

  beforeEach(() => {
    props = mockProps<typeof fetchFoldersByFolder>({
      allFolders: [{ uuid: 'previous' }],
      folderUuid: 'folderUuid',
      abortSignal: {
        aborted: false,
      },
    });
  });

  it('If signal is aborted then do nothing', async () => {
    // Given
    props.abortSignal = { aborted: true } as AbortSignal;

    // When
    await fetchFoldersByFolder(props);

    // Then
    expect(getFoldersByFolderMock).toHaveBeenCalledTimes(0);
  });

  it('Add only folders with status EXISTS', async () => {
    // Given
    getFoldersByFolderMock.mockResolvedValueOnce({ data: [{ status: 'EXISTS' }, { status: 'DELETED' }] });

    // When
    const { newFolders } = await fetchFoldersByFolder(props);

    // Then
    expect(newFolders).toStrictEqual([{ status: 'EXISTS' }]);
    expect(props.allFolders).toStrictEqual([{ uuid: 'previous' }, { status: 'EXISTS' }]);
  });

  it('If we fetch less than 50 folders, then do not fetch again', async () => {
    // Given
    getFoldersByFolderMock.mockResolvedValueOnce({ data: [] });

    // When
    const { newFolders } = await fetchFoldersByFolder(props);

    // Then
    expect(newFolders).toStrictEqual([]);
    expect(props.allFolders).toStrictEqual([{ uuid: 'previous' }]);
  });

  it('If we fetch 50 folders, then fetch again', async () => {
    // Given
    getFoldersByFolderMock.mockResolvedValueOnce({ data: Array(50).fill({ status: 'EXISTS' }) });
    getFoldersByFolderMock.mockResolvedValueOnce({ data: [] });

    // When
    const { newFolders } = await fetchFoldersByFolder(props);

    // Then
    expect(newFolders).toHaveLength(50);
    expect(props.allFolders).toHaveLength(51);
    expect(getFoldersByFolderMock).toHaveBeenCalledTimes(2);
  });

  it('If fetch fails, then throw error', async () => {
    // Given
    getFoldersByFolderMock.mockResolvedValueOnce({ error: new Error() });

    // When
    await expect(() => fetchFoldersByFolder(props)).rejects.toThrowError();

    // Then
    expect(getFoldersByFolderMock).toHaveBeenCalledTimes(1);
  });
});
