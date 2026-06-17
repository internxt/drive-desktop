import { DriveServerError } from '../../../../infra/drive-server/drive-server.error';
import * as fetchFileMetaByPathModule from '../../../../infra/drive-server/services/files/services/fetch-file-meta-by-path';
import * as fetchFolderMetaByPathModule from '../../../../infra/drive-server/services/folder/services/fetch-folder-meta-by-path';
import { resolveShareableItem } from './resolve-shareable-item';
import { call, calls, partialSpyOn } from 'tests/vitest/utils.helper';

describe('resolve-shareable-item', () => {
  const fetchFileMetaByPathMock = partialSpyOn(fetchFileMetaByPathModule, 'fetchFileMetaByPath');
  const fetchFolderMetaByPathMock = partialSpyOn(fetchFolderMetaByPathModule, 'fetchFolderMetaByPath');

  let props: Parameters<typeof resolveShareableItem>[0];

  beforeEach(() => {
    props = { path: '/folder/file.txt' };
  });

  it('should resolve a file item when file metadata exists', async () => {
    // Given
    fetchFileMetaByPathMock.mockResolvedValueOnce({ data: { uuid: 'file-uuid' } } as object);

    // When
    const result = await resolveShareableItem(props);

    // Then
    expect(result).toStrictEqual({
      itemId: 'file-uuid',
      itemType: 'file',
    });
    call(fetchFileMetaByPathMock).toStrictEqual({ path: '/folder/file.txt' });
    calls(fetchFolderMetaByPathMock).toHaveLength(0);
  });

  it('should resolve a folder item when file is not found and folder exists', async () => {
    // Given
    fetchFileMetaByPathMock.mockResolvedValueOnce({ error: new DriveServerError('NOT_FOUND', 404) } as object);
    fetchFolderMetaByPathMock.mockResolvedValueOnce({ data: { uuid: 'folder-uuid' } } as object);

    // When
    const result = await resolveShareableItem(props);

    // Then
    expect(result).toStrictEqual({
      itemId: 'folder-uuid',
      itemType: 'folder',
    });
    call(fetchFileMetaByPathMock).toStrictEqual({ path: '/folder/file.txt' });
    call(fetchFolderMetaByPathMock).toStrictEqual({ path: '/folder/file.txt' });
  });

  it('should try normalized path variant when first candidate is not found', async () => {
    // Given
    props.path = 'folder/file.txt';
    fetchFileMetaByPathMock
      .mockResolvedValueOnce({ error: new DriveServerError('NOT_FOUND', 404) } as object)
      .mockResolvedValueOnce({ data: { uuid: 'file-uuid' } } as object);
    fetchFolderMetaByPathMock.mockResolvedValueOnce({ error: new DriveServerError('NOT_FOUND', 404) } as object);

    // When
    const result = await resolveShareableItem(props);

    // Then
    expect(result).toStrictEqual({
      itemId: 'file-uuid',
      itemType: 'file',
    });
    calls(fetchFileMetaByPathMock).toStrictEqual([{ path: 'folder/file.txt' }, { path: '/folder/file.txt' }]);
    call(fetchFolderMetaByPathMock).toStrictEqual({ path: 'folder/file.txt' });
  });

  it('should throw when no metadata exists for any candidate path', async () => {
    // Given
    props.path = 'folder/file.txt';
    fetchFileMetaByPathMock
      .mockResolvedValueOnce({ error: new DriveServerError('NOT_FOUND', 404) } as object)
      .mockResolvedValueOnce({ error: new DriveServerError('NOT_FOUND', 404) } as object);
    fetchFolderMetaByPathMock
      .mockResolvedValueOnce({ error: new DriveServerError('NOT_FOUND', 404) } as object)
      .mockResolvedValueOnce({ error: new DriveServerError('NOT_FOUND', 404) } as object);

    // When / Then
    await expect(resolveShareableItem(props)).rejects.toThrow(
      'No Internxt item metadata found for path: folder/file.txt',
    );

    calls(fetchFileMetaByPathMock).toStrictEqual([{ path: 'folder/file.txt' }, { path: '/folder/file.txt' }]);
    calls(fetchFolderMetaByPathMock).toStrictEqual([{ path: 'folder/file.txt' }, { path: '/folder/file.txt' }]);
  });

  it('should throw when file metadata fetch fails with non-NOT_FOUND error', async () => {
    // Given
    fetchFileMetaByPathMock.mockResolvedValueOnce({
      error: new DriveServerError('SERVER_ERROR', 500, 'boom-file'),
    } as object);

    // When / Then
    await expect(resolveShareableItem(props)).rejects.toThrow('Error while fetching file metadata by path: boom-file');

    call(fetchFileMetaByPathMock).toStrictEqual({ path: '/folder/file.txt' });
    calls(fetchFolderMetaByPathMock).toHaveLength(0);
  });

  it('should throw when folder metadata fetch fails with non-NOT_FOUND error', async () => {
    // Given
    fetchFileMetaByPathMock.mockResolvedValueOnce({ error: new DriveServerError('NOT_FOUND', 404) } as object);
    fetchFolderMetaByPathMock.mockResolvedValueOnce({
      error: new DriveServerError('SERVER_ERROR', 500, 'boom-folder'),
    } as object);

    // When / Then
    await expect(resolveShareableItem(props)).rejects.toThrow(
      'Error while fetching folder metadata by path: boom-folder',
    );

    call(fetchFileMetaByPathMock).toStrictEqual({ path: '/folder/file.txt' });
    call(fetchFolderMetaByPathMock).toStrictEqual({ path: '/folder/file.txt' });
  });
});
