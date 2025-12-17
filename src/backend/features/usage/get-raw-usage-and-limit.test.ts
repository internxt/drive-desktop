import { getRawUsageAndLimit } from './get-raw-usage-and-limit';
import { getUsageAndLimit } from './get-usage-and-limit';

vi.mock('./get-usage-and-limit');

const mockGetUsageAndLimit = vi.mocked(getUsageAndLimit);

describe('getRawUsageAndLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return raw usage and limit when getUsageAndLimit is successful', async () => {
    const mockData = {
      usageInBytes: 2048,
      limitInBytes: 10240,
    };
    mockGetUsageAndLimit.mockResolvedValue({ data: mockData });

    const result = await getRawUsageAndLimit();

    expect(result.data).toEqual({
      driveUsage: 2048,
      limitInBytes: 10240,
    });
    expect(result.error).toBeUndefined();
    expect(mockGetUsageAndLimit).toHaveBeenCalledTimes(1);
  });

  it('should return error when getUsageAndLimit fails', async () => {
    const mockError = new Error('Failed to fetch usage and limit');
    mockGetUsageAndLimit.mockResolvedValue({ error: mockError });

    const result = await getRawUsageAndLimit();

    expect(result.error).toBe(mockError);
    expect(result.data).toBeUndefined();
    expect(mockGetUsageAndLimit).toHaveBeenCalledTimes(1);
  });
});
