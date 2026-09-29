import { mockProps } from '@/tests/vitest/utils.helper.test';
import { DriveServerWipError } from '../../defs';
import { clientWrapper } from '../../in/client-wrapper.service';
import { getFoldersSyncPage } from './get-folders-sync-page';

vi.mock(import('../../in/client-wrapper.service'));

describe('get-folders-sync-page', () => {
  const clientWrapperMock = vi.mocked(clientWrapper);
  const getFolders = vi.fn();
  const props = mockProps<typeof getFoldersSyncPage>({
    ctx: {
      abortController: new AbortController(),
      client: { GET: getFolders },
    },
    context: { query: { updatedAt: '2026-09-23T10:00:00.000Z', limit: 1000 } },
  });

  beforeEach(() => {
    getFolders.mockReset();
  });

  it('maps a cursor page and passes the request to the folders sync endpoint', async () => {
    // Given
    clientWrapperMock.mockResolvedValue({ data: { folders: [], nextCursor: 'next-cursor' } });

    // When
    const result = await getFoldersSyncPage(props);
    const [[{ promiseFn }]] = clientWrapperMock.mock.calls;
    await promiseFn();

    // Then
    expect(result).toStrictEqual({ data: { items: [], nextCursor: 'next-cursor' }, error: undefined });
    expect(getFolders).toHaveBeenCalledWith('/folders/sync', {
      signal: props.ctx.abortController.signal,
      params: { query: props.context.query },
    });
  });

  it('returns the client error', async () => {
    // Given
    const error = new DriveServerWipError('UNKNOWN', new Error('request failed'));
    clientWrapperMock.mockResolvedValue({ error });

    // When
    const result = await getFoldersSyncPage(props);

    // Then
    expect(result).toStrictEqual({ error, data: undefined });
  });

  it('removes ordinary folder details from mapped synchronization items', async () => {
    // Given
    clientWrapperMock.mockResolvedValue({
      data: {
        folders: [
          {
            type: 'folder',
            id: 1,
            parentId: 2,
            parentUuid: 'parent-uuid',
            name: 'folder',
            parent: {},
            bucket: 'bucket',
            userId: 3,
            encryptVersion: '03-aes',
            createdAt: '2026-09-23T10:00:00.000Z',
            updatedAt: '2026-09-23T10:00:00.000Z',
            uuid: 'folder-uuid',
            plainName: 'folder',
            size: 100,
            creationTime: '2026-09-23T10:00:00.000Z',
            modificationTime: '2026-09-23T10:00:00.000Z',
            status: 'EXISTS',
            removed: false,
            deleted: false,
            isFavorite: true,
          },
        ],
        nextCursor: null,
      },
    });

    // When
    const result = await getFoldersSyncPage(props);

    // Then
    expect(result.data?.items[0]).toMatchObject({ uuid: 'folder-uuid' });
    expect(result.data?.items[0]).not.toHaveProperty('isFavorite');
  });
});
