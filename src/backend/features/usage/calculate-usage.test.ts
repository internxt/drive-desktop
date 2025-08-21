import { calculateUsage } from './calculate-usage';
import { getUsageAndLimit } from './get-usage-and-limit';
import { INFINITE_SPACE_TRHESHOLD, OFFER_UPGRADE_TRHESHOLD } from './usage.types';

jest.mock('./get-usage-and-limit');

const mockGetUsageAndLimit = getUsageAndLimit as jest.MockedFunction<typeof getUsageAndLimit>;

describe('calculateUsage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return usage when getUsageAndLimit is successful', async () => {
    const mockData = {
      usageInBytes: 1024,
      limitInBytes: 5120,
    };
    mockGetUsageAndLimit.mockResolvedValue({ data: mockData });

    const result = await calculateUsage();

    expect(result.data).toEqual({
      usageInBytes: 1024,
      limitInBytes: 5120,
      isInfinite: false,
      offerUpgrade: true,
    });
    expect(result.error).toBeUndefined();
  });

  it('should return error when getUsageAndLimit fails', async () => {
    const mockError = new Error('Usage fetch failed');
    mockGetUsageAndLimit.mockResolvedValue({ error: mockError });

    const result = await calculateUsage();

    expect(result.error).toBe(mockError);
    expect(result.data).toBeUndefined();
  });

  it('should mark space as infinite when limit exceeds infinite threshold', async () => {
    const mockData = {
      usageInBytes: 1024,
      limitInBytes: INFINITE_SPACE_TRHESHOLD + 1000,
    };
    mockGetUsageAndLimit.mockResolvedValue({ data: mockData });

    const result = await calculateUsage();

    expect(result.data?.isInfinite).toBe(true);
    expect(result.data?.offerUpgrade).toBe(false);
  });

  it('should mark space as finite when limit is below infinite threshold', async () => {
    const mockData = {
      usageInBytes: 1024,
      limitInBytes: INFINITE_SPACE_TRHESHOLD - 1000,
    };
    mockGetUsageAndLimit.mockResolvedValue({ data: mockData });

    const result = await calculateUsage();

    expect(result.data?.isInfinite).toBe(false);
  });

  it('should offer upgrade when limit is below upgrade threshold', async () => {
    const mockData = {
      usageInBytes: 1024,
      limitInBytes: OFFER_UPGRADE_TRHESHOLD - 1000,
    };
    mockGetUsageAndLimit.mockResolvedValue({ data: mockData });

    const result = await calculateUsage();

    expect(result.data?.offerUpgrade).toBe(true);
  });

  it('should not offer upgrade when limit exceeds upgrade threshold', async () => {
    const mockData = {
      usageInBytes: 1024,
      limitInBytes: OFFER_UPGRADE_TRHESHOLD + 1000,
    };
    mockGetUsageAndLimit.mockResolvedValue({ data: mockData });

    const result = await calculateUsage();

    expect(result.data?.offerUpgrade).toBe(false);
  });

  it('should handle edge case where limit equals infinite threshold', async () => {
    const mockData = {
      usageInBytes: 1024,
      limitInBytes: INFINITE_SPACE_TRHESHOLD,
    };
    mockGetUsageAndLimit.mockResolvedValue({ data: mockData });

    const result = await calculateUsage();

    expect(result.data?.isInfinite).toBe(true);
  });

  it('should handle edge case where limit equals upgrade threshold', async () => {
    const mockData = {
      usageInBytes: 1024,
      limitInBytes: OFFER_UPGRADE_TRHESHOLD,
    };
    mockGetUsageAndLimit.mockResolvedValue({ data: mockData });

    const result = await calculateUsage();

    expect(result.data?.offerUpgrade).toBe(false);
  });
});
