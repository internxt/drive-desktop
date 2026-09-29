import { mockProps } from '@/tests/vitest/utils.helper.test';
import { DriveServerWipError } from '../../defs';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getFilesSyncPage } from './get-files-sync-page';

vi.mock(import('../../in/client-wrapper.service'));

describe('get-files-sync-page', () => {
  const clientWrapperMock = vi.mocked(clientWrapper);
  const getFiles = vi.fn();
  const props = mockProps<typeof getFilesSyncPage>({
    ctx: {
      abortController: new AbortController(),
      client: { GET: getFiles },
    },
    context: { query: { updatedAt: '2026-09-23T10:00:00.000Z', limit: 1000 } },
  });

  beforeEach(() => {
    getFiles.mockReset();
  });

  it('maps a cursor page and passes the request to the files sync endpoint', async () => {
    // Given
    clientWrapperMock.mockResolvedValue({ data: { files: [], nextCursor: 'next-cursor' } });

    // When
    const result = await getFilesSyncPage(props);
    const [[{ promiseFn }]] = clientWrapperMock.mock.calls;
    await promiseFn();

    // Then
    expect(result).toStrictEqual({ data: { items: [], nextCursor: 'next-cursor' }, error: undefined });
    expect(getFiles).toHaveBeenCalledWith('/files/sync', {
      signal: props.ctx.abortController.signal,
      params: { query: props.context.query },
    });
  });

  it('returns the client error', async () => {
    // Given
    const error = new DriveServerWipError('UNKNOWN', new Error('request failed'));
    clientWrapperMock.mockResolvedValue({ error });

    // When
    const result = await getFilesSyncPage(props);

    // Then
    expect(result).toStrictEqual({ error, data: undefined });
  });

  it('removes ordinary file details from mapped synchronization items', async () => {
    // Given
    clientWrapperMock.mockResolvedValue({
      data: {
        files: [
          {
            id: 1,
            uuid: 'file-uuid',
            fileId: null,
            name: 'file.txt',
            type: 'txt',
            size: '100',
            bucket: 'bucket',
            folderId: 2,
            folderUuid: 'folder-uuid',
            encryptVersion: '03-aes',
            userId: 3,
            creationTime: '2026-09-23T10:00:00.000Z',
            modificationTime: '2026-09-23T10:00:00.000Z',
            createdAt: '2026-09-23T10:00:00.000Z',
            updatedAt: '2026-09-23T10:00:00.000Z',
            plainName: 'file',
            status: 'EXISTS',
            isFavorite: true,
            thumbnails: [],
          },
        ],
        nextCursor: null,
      },
    });

    // When
    const result = await getFilesSyncPage(props);

    // Then
    expect(result.data?.items[0]).toMatchObject({ uuid: 'file-uuid', fileId: '' });
    expect(result.data?.items[0]).not.toHaveProperty('isFavorite');
    expect(result.data?.items[0]).not.toHaveProperty('thumbnails');
  });
});
