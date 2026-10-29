import { electronStore } from '@/apps/main/config';
import * as fetchUserFileSizeLimitModule from '@/infra/drive-server-wip/services/files/fetch-user-file-size-limit';
import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getFileSizeLimitAdapter } from './get-file-size-limit-adapter';

describe('get-file-size-limit-adapter', () => {
  const electronStoreGetMock = partialSpyOn(electronStore, 'get');
  const electronStoreSetMock = partialSpyOn(electronStore, 'set');
  const fetchUserFileSizeLimitMock = partialSpyOn(fetchUserFileSizeLimitModule, 'fetchUserFileSizeLimit');

  let props: Parameters<typeof getFileSizeLimitAdapter>[0];

  beforeEach(() => {
    props = mockProps<typeof getFileSizeLimitAdapter>({ ctx: {} });
  });

  it('should read the stored limit', () => {
    // Given
    electronStoreGetMock.mockReturnValue(10);
    // When
    const res = getFileSizeLimitAdapter(props).getStoredLimit();
    // Then
    expect(res).toBe(10);
    call(electronStoreGetMock).toBe('maxUploadFileSizeInBytes');
  });

  it('should save the limit', () => {
    // When
    getFileSizeLimitAdapter(props).saveLimit({ limit: 20 });
    // Then
    expect(electronStoreSetMock.mock.calls).toStrictEqual([['maxUploadFileSizeInBytes', 20]]);
  });

  it('should read the last revalidation time', () => {
    // Given
    electronStoreGetMock.mockReturnValue(1000);
    // When
    const res = getFileSizeLimitAdapter(props).getLastRevalidatedAt();
    // Then
    expect(res).toBe(1000);
    call(electronStoreGetMock).toBe('fileSizeLimitRevalidatedAt');
  });

  it('should save the last revalidation time', () => {
    // When
    getFileSizeLimitAdapter(props).saveLastRevalidatedAt({ timestamp: 2000 });
    // Then
    expect(electronStoreSetMock.mock.calls).toStrictEqual([['fileSizeLimitRevalidatedAt', 2000]]);
  });

  it('should fetch the limit with the context', async () => {
    // Given
    fetchUserFileSizeLimitMock.mockResolvedValue({ data: 30 });
    // When
    const res = await getFileSizeLimitAdapter(props).fetchLimit();
    // Then
    expect(res).toStrictEqual({ data: 30 });
    call(fetchUserFileSizeLimitMock).toStrictEqual({ ctx: props.ctx });
  });
});
