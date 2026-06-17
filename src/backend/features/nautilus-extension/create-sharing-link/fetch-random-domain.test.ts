import * as fetchPublicSharingDomainsModule from '../../../../infra/drive-server/services/sharings/services/fetch-public-sharing-domains';
import { fetchRandomDomain } from './fetch-random-domain';
import { call, partialSpyOn } from 'tests/vitest/utils.helper';

describe('fetch-random-domain', () => {
  const fetchPublicSharingDomainsMock = partialSpyOn(fetchPublicSharingDomainsModule, 'fetchPublicSharingDomains');

  it('should return a random domain without trailing slash', async () => {
    fetchPublicSharingDomainsMock.mockResolvedValueOnce({
      data: {
        list: ['https://share1.internxt.com/', 'https://share2.internxt.com/', 'https://share3.internxt.com/'],
      },
    } as object);

    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const result = await fetchRandomDomain();

    expect(result).toBe('https://share2.internxt.com');
    call(fetchPublicSharingDomainsMock).toStrictEqual([]);
  });

  it('should throw error when fetchPublicSharingDomains returns error', async () => {
    const error = new Error('Network error');
    fetchPublicSharingDomainsMock.mockResolvedValueOnce({
      error,
    } as object);

    await expect(fetchRandomDomain()).rejects.toThrow('Error while fetching public sharing domains: Network error');
  });

  it('should throw error when no domains available', async () => {
    fetchPublicSharingDomainsMock.mockResolvedValueOnce({
      data: {
        list: [],
      },
    } as object);

    await expect(fetchRandomDomain()).resolves.toBeNull();
  });

  it('should handle domain without trailing slash', async () => {
    fetchPublicSharingDomainsMock.mockResolvedValueOnce({
      data: {
        list: ['https://share.internxt.com'],
      },
    } as object);

    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = await fetchRandomDomain();

    expect(result).toBe('https://share.internxt.com');
  });
});
