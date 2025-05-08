import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { fetchFilesByFolder } from './fetch-files-by-folder';
import { FileDto } from '@/infra/drive-server-wip/out/dto';

vi.mock(import('@/apps/main/util'));

describe('fetch-files-by-folder', () => {
  const getFilesByFolderMock = deepMocked(driveServerWip.folders.getFilesByFolder);

  const folderUuid = 'folderUuid';
  let allFiles: FileDto[];

  beforeEach(() => {
    vi.clearAllMocks();
    allFiles = [{ uuid: 'previous' }] as FileDto[];
  });

  it('Add only files with status EXISTS', async () => {
    // Given
    getFilesByFolderMock.mockResolvedValueOnce({ data: [{ status: 'EXISTS' }, { status: 'DELETED' }] });

    // When
    await fetchFilesByFolder({ folderUuid, allFiles });

    // Then
    expect(allFiles).toStrictEqual([{ uuid: 'previous' }, { status: 'EXISTS' }]);
  });

  it('If we fetch less than 50 files, then do not fetch again', async () => {
    // Given
    getFilesByFolderMock.mockResolvedValueOnce({ data: [] });

    // When
    await fetchFilesByFolder({ folderUuid, allFiles });

    // Then
    expect(allFiles).toStrictEqual([{ uuid: 'previous' }]);
    expect(getFilesByFolderMock).toHaveBeenCalledTimes(1);
  });

  it('If we fetch 50 files, then fetch again', async () => {
    // Given
    getFilesByFolderMock.mockResolvedValueOnce({ data: Array(50).fill({ status: 'EXISTS' }) });
    getFilesByFolderMock.mockResolvedValueOnce({ data: [] });

    // When
    await fetchFilesByFolder({ folderUuid, allFiles });

    // Then
    expect(allFiles).toHaveLength(51);
    expect(getFilesByFolderMock).toHaveBeenCalledTimes(2);
  });

  it('If fetch fails, then retry at least 3 times and keep offset', async () => {
    // Given
    getFilesByFolderMock.mockResolvedValueOnce({ error: new Error() });
    getFilesByFolderMock.mockResolvedValueOnce({ error: new Error() });
    getFilesByFolderMock.mockResolvedValueOnce({ data: Array(50).fill({ status: 'EXISTS' }) });
    getFilesByFolderMock.mockResolvedValueOnce({ error: new Error() });
    getFilesByFolderMock.mockResolvedValueOnce({ error: new Error() });
    getFilesByFolderMock.mockResolvedValueOnce({ error: new Error() });

    // When
    await expect(() => fetchFilesByFolder({ folderUuid, allFiles: [] })).rejects.toThrowError();

    // Then
    expect(getFilesByFolderMock).toHaveBeenCalledTimes(6);
  });
});
