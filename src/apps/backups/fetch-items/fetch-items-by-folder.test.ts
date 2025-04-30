import { deepMocked } from 'tests/vitest/utils.helper.test';
import { fetchFilesByFolder } from './fetch-files-by-folder';
import { fetchFoldersByFolder } from './fetch-folders-by-folder';
import { fetchItemsByFolder } from './fetch-items-by-folder';
import { FolderDto, FileDto } from '@/infra/drive-server-wip/out/dto';

vi.mock(import('./fetch-files-by-folder'));
vi.mock(import('./fetch-folders-by-folder'));

describe('fetch-items-by-folder', () => {
  const fetchFilesByFolderMock = deepMocked(fetchFilesByFolder);
  const fetchFoldersByFolderMock = deepMocked(fetchFoldersByFolder);

  const folderUuid = 'folderUuid';
  const allFolders: FolderDto[] = [];
  const allFiles: FileDto[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('If no new folders are fetched then do not call fetch recursively', async () => {
    // Given
    fetchFoldersByFolderMock.mockResolvedValueOnce({ newFolders: [] });

    // When
    await fetchItemsByFolder({ folderUuid, allFolders, allFiles, skipFiles: false });

    // Then
    expect(fetchFoldersByFolderMock).toHaveBeenCalledWith({ folderUuid, allFolders });
    expect(fetchFilesByFolderMock).toHaveBeenCalledWith({ folderUuid, allFiles });
    expect(fetchFoldersByFolderMock).toHaveBeenCalledTimes(1);
    expect(fetchFilesByFolderMock).toHaveBeenCalledTimes(1);
  });

  it('If new folders are fetched then call fetch recursively', async () => {
    // Given
    fetchFoldersByFolderMock.mockResolvedValueOnce({ newFolders: [{ uuid: 'uuid1' }, { uuid: 'uuid2' }] });
    fetchFoldersByFolderMock.mockResolvedValue({ newFolders: [] });

    // When
    await fetchItemsByFolder({ folderUuid, allFolders, allFiles, skipFiles: false });

    // Then
    expect(fetchFoldersByFolderMock).toHaveBeenCalledWith({ folderUuid, allFolders });
    expect(fetchFoldersByFolderMock).toHaveBeenCalledWith({ folderUuid: 'uuid1', allFolders });
    expect(fetchFoldersByFolderMock).toHaveBeenCalledWith({ folderUuid: 'uuid2', allFolders });
    expect(fetchFilesByFolderMock).toHaveBeenCalledWith({ folderUuid, allFiles });
    expect(fetchFoldersByFolderMock).toHaveBeenCalledTimes(3);
    expect(fetchFilesByFolderMock).toHaveBeenCalledTimes(3);
  });

  it('If skip files is true then do not fetch files', async () => {
    // Given
    fetchFoldersByFolderMock.mockResolvedValueOnce({ newFolders: [{ uuid: 'uuid1' }, { uuid: 'uuid2' }] });
    fetchFoldersByFolderMock.mockResolvedValue({ newFolders: [] });

    // When
    await fetchItemsByFolder({ folderUuid, allFolders, allFiles, skipFiles: true });

    // Then
    expect(fetchFoldersByFolderMock).toHaveBeenCalledWith({ folderUuid, allFolders });
    expect(fetchFoldersByFolderMock).toHaveBeenCalledWith({ folderUuid: 'uuid1', allFolders });
    expect(fetchFoldersByFolderMock).toHaveBeenCalledWith({ folderUuid: 'uuid2', allFolders });
    expect(fetchFoldersByFolderMock).toHaveBeenCalledTimes(3);
    expect(fetchFilesByFolderMock).toHaveBeenCalledTimes(0);
  });
});
