import { client } from '@/apps/shared/HttpClient/client';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getClientCompatibility } from './get-client-compatibility';

describe('get-client-compatibility', () => {
  const getMock = partialSpyOn(client, 'GET');
  const compatibility = { status: 'deprecated', message: null, recommendedVersion: '2.8.1', sunsetAt: '2026-12-01T00:00:00.000Z' };

  it('should send the client headers and return the compatibility', async () => {
    // Given
    getMock.mockResolvedValue({ data: compatibility, response: new Response() });
    // When
    const res = await getClientCompatibility();
    // Then
    expect(getMock).toHaveBeenCalledWith('/clients/compatibility', {
      params: { header: { 'internxt-client': 'drive-desktop-windows', 'internxt-version': expect.any(String) } },
      signal: expect.any(AbortSignal),
    });
    expect(res).toStrictEqual({ data: compatibility });
  });

  it('should return an error when the backend does not return data', async () => {
    // Given
    getMock.mockResolvedValue({ error: { message: 'Bad request' }, response: new Response(null, { status: 400 }) });
    // When
    const res = await getClientCompatibility();
    // Then
    expect(res.error?.message).toBe('Client compatibility request failed with status 400');
  });

  it('should return an error instead of throwing when the request fails', async () => {
    // Given
    getMock.mockRejectedValue(new TypeError('fetch failed'));
    // When
    const res = await getClientCompatibility();
    // Then
    expect(res.error).toBeInstanceOf(TypeError);
  });
});
