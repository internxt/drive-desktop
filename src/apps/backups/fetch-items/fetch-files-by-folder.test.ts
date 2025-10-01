import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deepMocked, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { fetchFilesByFolder } from './fetch-files-by-folder';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as newParseFileDto from '@/infra/drive-server-wip/out/dto';

vi.mock(import('@/apps/main/util'));
vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('fetch-files-by-folder', () => {
  partialSpyOn(newParseFileDto, 'newParseFileDto');
  const getFilesByFolderMock = deepMocked(driveServerWip.folders.getFilesByFolder);

  let props: Parameters<typeof fetchFilesByFolder>[0];

  beforeEach(() => {
    props = mockProps<typeof fetchFilesByFolder>({
      allFiles: [{ uuid: 'previous' as FileUuid }],
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

  it('If we fetch less than 1000 files, then do not fetch again', async () => {
    // Given
    getFilesByFolderMock.mockResolvedValueOnce({ data: [] });

    // When
    await fetchFilesByFolder(props);

    // Then
    expect(props.allFiles).toStrictEqual([{ uuid: 'previous' }]);
    expect(getFilesByFolderMock).toHaveBeenCalledTimes(1);
  });

  it('If we fetch 1000 files, then fetch again', async () => {
    // Given
    getFilesByFolderMock.mockResolvedValueOnce({ data: Array(1000).fill({ status: 'EXISTS' }) });
    getFilesByFolderMock.mockResolvedValueOnce({ data: [] });

    // When
    await fetchFilesByFolder(props);

    // Then
    expect(props.allFiles).toHaveLength(1001);
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
