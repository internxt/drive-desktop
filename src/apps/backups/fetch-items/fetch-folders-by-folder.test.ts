import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { fetchFoldersByFolder } from './fetch-folders-by-folder';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';

vi.mock(import('@/apps/main/util'));

describe('fetch-folders-by-folder', () => {
  const getFoldersByFolderMock = deepMocked(driveServerWip.folders.getFoldersByFolder);

  const folderUuid = 'folderUuid';
  let allFolders: FolderDto[];

  beforeEach(() => {
    vi.clearAllMocks();
    allFolders = [{ uuid: 'previous' }] as FolderDto[];
  });

  it('Add only folders with status EXISTS', async () => {
    // Given
    getFoldersByFolderMock.mockResolvedValueOnce({ data: [{ status: 'EXISTS' }, { status: 'DELETED' }] });

    // When
    const { newFolders } = await fetchFoldersByFolder({ folderUuid, allFolders });

    // Then
    expect(newFolders).toStrictEqual([{ status: 'EXISTS' }]);
    expect(allFolders).toStrictEqual([{ uuid: 'previous' }, { status: 'EXISTS' }]);
  });

  it('If we fetch less than 50 folders, then do not fetch again', async () => {
    // Given
    getFoldersByFolderMock.mockResolvedValueOnce({ data: [{}] });

    // When
    const { newFolders } = await fetchFoldersByFolder({ folderUuid, allFolders });

    // Then
    expect(newFolders).toStrictEqual([]);
    expect(allFolders).toStrictEqual([{ uuid: 'previous' }]);
  });

  it('If we fetch 50 folders, then fetch again', async () => {
    // Given
    getFoldersByFolderMock.mockResolvedValueOnce({ data: Array(50).fill({ status: 'EXISTS' }) });
    getFoldersByFolderMock.mockResolvedValueOnce({ data: [] });

    // When
    const { newFolders } = await fetchFoldersByFolder({ folderUuid, allFolders });

    // Then
    expect(newFolders).toHaveLength(50);
    expect(allFolders).toHaveLength(51);
    expect(getFoldersByFolderMock).toHaveBeenCalledTimes(2);
  });

  it('If fetch fails, then retry at least 3 times and keep offset', async () => {
    // Given
    getFoldersByFolderMock.mockResolvedValueOnce({ error: new Error() });
    getFoldersByFolderMock.mockResolvedValueOnce({ error: new Error() });
    getFoldersByFolderMock.mockResolvedValueOnce({ data: Array(50).fill({ status: 'EXISTS' }) });
    getFoldersByFolderMock.mockResolvedValueOnce({ error: new Error() });
    getFoldersByFolderMock.mockResolvedValueOnce({ error: new Error() });
    getFoldersByFolderMock.mockResolvedValueOnce({ error: new Error() });

    // When
    await expect(() => fetchFoldersByFolder({ folderUuid, allFolders: [] })).rejects.toThrowError();

    // Then
    expect(getFoldersByFolderMock).toHaveBeenCalledTimes(6);
  });
});
