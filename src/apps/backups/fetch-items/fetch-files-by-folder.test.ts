import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deepMocked, mockProps } from 'tests/vitest/utils.helper.test';
import { fetchFilesByFolder } from './fetch-files-by-folder';

vi.mock(import('@/apps/main/util'));
vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('fetch-files-by-folder', () => {
  const getFilesByFolderMock = deepMocked(driveServerWip.folders.getFilesByFolder);

  let props: Parameters<typeof fetchFilesByFolder>[0];

  beforeEach(() => {
    vi.clearAllMocks();

    props = mockProps<typeof fetchFilesByFolder>({
      allFiles: [{ uuid: 'previous' }],
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
    await fetchFilesByFolder(props);

    // Then
    expect(getFilesByFolderMock).toHaveBeenCalledTimes(0);
  });

  it('Add only files with status EXISTS', async () => {
    // Given
    getFilesByFolderMock.mockResolvedValueOnce({ data: [{ status: 'EXISTS' }, { status: 'DELETED' }] });

    // When
    await fetchFilesByFolder(props);

    // Then
    expect(props.allFiles).toStrictEqual([{ uuid: 'previous' }, { status: 'EXISTS' }]);
  });

  it('If we fetch less than 50 files, then do not fetch again', async () => {
    // Given
    getFilesByFolderMock.mockResolvedValueOnce({ data: [] });

    // When
    await fetchFilesByFolder(props);

    // Then
    expect(props.allFiles).toStrictEqual([{ uuid: 'previous' }]);
    expect(getFilesByFolderMock).toHaveBeenCalledTimes(1);
  });

  it('If we fetch 50 files, then fetch again', async () => {
    // Given
    getFilesByFolderMock.mockResolvedValueOnce({ data: Array(50).fill({ status: 'EXISTS' }) });
    getFilesByFolderMock.mockResolvedValueOnce({ data: [] });

    // When
    await fetchFilesByFolder(props);

    // Then
    expect(props.allFiles).toHaveLength(51);
    expect(getFilesByFolderMock).toHaveBeenCalledTimes(2);
  });

  it('If fetch fails, then throw error', async () => {
    // Given
    getFilesByFolderMock.mockResolvedValueOnce({ error: new Error() });

    // When
    await expect(() => fetchFilesByFolder(props)).rejects.toThrowError();

    // Then
    expect(getFilesByFolderMock).toHaveBeenCalledTimes(1);
  });
});
