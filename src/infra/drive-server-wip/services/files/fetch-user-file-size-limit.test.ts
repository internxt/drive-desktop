import { mockProps } from '@/tests/vitest/utils.helper.test';
import { fetchUserFileSizeLimit } from './fetch-user-file-size-limit';

describe('fetch-user-file-size-limit', () => {
  const getMock = vi.fn();

  let props: Parameters<typeof fetchUserFileSizeLimit>[0];

  beforeEach(() => {
    getMock.mockResolvedValue({ data: { maxUploadFileSize: 100 } });

    props = mockProps<typeof fetchUserFileSizeLimit>({
      ctx: { client: { GET: getMock }, abortController: new AbortController() },
    });
  });

  it('should return the limit returned by the backend', async () => {
    // When
    const res = await fetchUserFileSizeLimit(props);
    // Then
    expect(res).toStrictEqual({ data: 100 });
    expect(getMock.mock.calls).toStrictEqual([['/files/limits', { signal: expect.any(AbortSignal) }]]);
  });

  it('should return an error if the backend does not return a valid limit', async () => {
    // Given
    getMock.mockResolvedValue({ data: { maxUploadFileSize: null } });
    // When
    const res = await fetchUserFileSizeLimit(props);
    // Then
    expect(res.error?.message).toBe('Invalid user file size limit response');
  });

  it('should return an error if the request throws', async () => {
    // Given
    getMock.mockRejectedValue(new Error('Network error'));
    // When
    const res = await fetchUserFileSizeLimit(props);
    // Then
    expect(res.error?.message).toBe('Error fetching user file size limit');
  });
});
