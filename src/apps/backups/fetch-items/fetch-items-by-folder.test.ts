import { deepMocked, mockProps } from 'tests/vitest/utils.helper.test';
import { fetchFilesByFolder } from './fetch-files-by-folder';
import { fetchFoldersByFolder } from './fetch-folders-by-folder';
import { fetchItemsByFolder } from './fetch-items-by-folder';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';

vi.mock(import('./fetch-files-by-folder'));
vi.mock(import('./fetch-folders-by-folder'));

describe('fetch-items-by-folder', () => {
  const fetchFilesByFolderMock = deepMocked(fetchFilesByFolder);
  const fetchFoldersByFolderMock = deepMocked(fetchFoldersByFolder);

  const folderUuid = 'folderUuid';
  const allFolders: FolderDto[] = [];
  const allFiles: SimpleDriveFile[] = [];
  const abortSignal = { aborted: false };

  let props: Parameters<typeof fetchItemsByFolder>[0];

  beforeEach(() => {
    props = mockProps<typeof fetchItemsByFolder>({
      folderUuid,
      allFolders,
      allFiles,
      abortSignal,
      skipFiles: false,
    });
  });

  it('If no new folders are fetched then do not call fetch recursively', async () => {
    // Given
    fetchFoldersByFolderMock.mockResolvedValueOnce({ newFolders: [] });

    // When
    await fetchItemsByFolder(props);

    // Then
    expect(fetchFoldersByFolderMock).toHaveBeenCalledWith({ folderUuid, allFolders, abortSignal });
    expect(fetchFilesByFolderMock).toHaveBeenCalledWith({ folderUuid, allFiles, abortSignal });
    expect(fetchFoldersByFolderMock).toHaveBeenCalledTimes(1);
    expect(fetchFilesByFolderMock).toHaveBeenCalledTimes(1);
  });

  it('If new folders are fetched then call fetch recursively', async () => {
    // Given
    fetchFoldersByFolderMock.mockResolvedValueOnce({ newFolders: [{ uuid: 'uuid1' }, { uuid: 'uuid2' }] });
    fetchFoldersByFolderMock.mockResolvedValue({ newFolders: [] });

    // When
    await fetchItemsByFolder(props);

    // Then
    expect(fetchFoldersByFolderMock).toHaveBeenCalledWith({ folderUuid, allFolders, abortSignal });
    expect(fetchFoldersByFolderMock).toHaveBeenCalledWith({ folderUuid: 'uuid1', allFolders, abortSignal });
    expect(fetchFoldersByFolderMock).toHaveBeenCalledWith({ folderUuid: 'uuid2', allFolders, abortSignal });
    expect(fetchFilesByFolderMock).toHaveBeenCalledWith({ folderUuid, allFiles, abortSignal });
    expect(fetchFoldersByFolderMock).toHaveBeenCalledTimes(3);
    expect(fetchFilesByFolderMock).toHaveBeenCalledTimes(3);
  });

  it('If skip files is true then do not fetch files', async () => {
    // Given
    props.skipFiles = true;
    fetchFoldersByFolderMock.mockResolvedValueOnce({ newFolders: [{ uuid: 'uuid1' }, { uuid: 'uuid2' }] });
    fetchFoldersByFolderMock.mockResolvedValue({ newFolders: [] });

    // When
    await fetchItemsByFolder(props);

    // Then
    expect(fetchFoldersByFolderMock).toHaveBeenCalledWith({ folderUuid, allFolders, abortSignal });
    expect(fetchFoldersByFolderMock).toHaveBeenCalledWith({ folderUuid: 'uuid1', allFolders, abortSignal });
    expect(fetchFoldersByFolderMock).toHaveBeenCalledWith({ folderUuid: 'uuid2', allFolders, abortSignal });
    expect(fetchFoldersByFolderMock).toHaveBeenCalledTimes(3);
    expect(fetchFilesByFolderMock).toHaveBeenCalledTimes(0);
  });
});
