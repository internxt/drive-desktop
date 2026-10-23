import { electronStore } from '@/apps/main/config';
import * as fetchUserFileSizeLimitModule from '@/infra/drive-server-wip/services/files/fetch-user-file-size-limit';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getFileSizeLimitAdapter } from './get-file-size-limit-adapter';
import * as retryRejectedUploadsModule from './retry-rejected-uploads';

describe('get-file-size-limit-adapter', () => {
  const electronStoreGetMock = partialSpyOn(electronStore, 'get');
  const electronStoreSetMock = partialSpyOn(electronStore, 'set');
  const fetchUserFileSizeLimitMock = partialSpyOn(fetchUserFileSizeLimitModule, 'fetchUserFileSizeLimit');
  const retryRejectedUploadsMock = partialSpyOn(retryRejectedUploadsModule, 'retryRejectedUploads');

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

  it('should save the limit and retry the rejected files if the limit goes up', () => {
    // Given
    electronStoreGetMock.mockReturnValue(10);
    // When
    getFileSizeLimitAdapter(props).saveLimit({ limit: 20 });
    // Then
    expect(electronStoreSetMock.mock.calls).toStrictEqual([['maxUploadFileSizeInBytes', 20]]);
    calls(retryRejectedUploadsMock).toHaveLength(1);
  });

  it('should save the limit without retrying the rejected files if the limit does not go up', () => {
    // Given
    electronStoreGetMock.mockReturnValue(20);
    // When
    getFileSizeLimitAdapter(props).saveLimit({ limit: 20 });
    // Then
    expect(electronStoreSetMock.mock.calls).toStrictEqual([['maxUploadFileSizeInBytes', 20]]);
    calls(retryRejectedUploadsMock).toHaveLength(0);
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
