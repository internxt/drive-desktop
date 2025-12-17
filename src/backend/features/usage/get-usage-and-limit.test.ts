import { getUsageAndLimit } from './get-usage-and-limit';
import { driveServerModule } from '../../../infra/drive-server/drive-server.module';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { left, right } from '../../../context/shared/domain/Either';

vi.mock('../../../infra/drive-server/drive-server.module', () => ({
  driveServerModule: {
    user: {
      getUsage: vi.fn(),
      getLimit: vi.fn(),
    },
  },
}));

vi.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const mockGetUsage = vi.mocked(driveServerModule.user.getUsage);
const mockGetLimit = vi.mocked(driveServerModule.user.getLimit);
const mockLogger = vi.mocked(logger);

describe('getUsageAndLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error when getUsage returns an error', async () => {
    const mockError = new Error('Usage fetch failed');
    mockGetUsage.mockResolvedValue(left(mockError));
    mockGetLimit.mockResolvedValue(right({ maxSpaceBytes: 5120 }));
    mockLogger.error.mockReturnValue(mockError);

    const result = await getUsageAndLimit();

    expect(result.error).toBe(mockError);
    expect(result.data).toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith({
      msg: 'getUsageAndLimit request was not succesfull',
    });
  });

  it('should return error when getLimit returns an error', async () => {
    const mockError = new Error('Limit fetch failed');
    mockGetUsage.mockResolvedValue(right({ drive: 1024, backup: 512, total: 1536 }));
    mockGetLimit.mockResolvedValue(left(mockError));
    mockLogger.error.mockReturnValue(mockError);

    const result = await getUsageAndLimit();

    expect(result.error).toBe(mockError);
    expect(result.data).toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith({
      msg: 'getUsageAndLimit request was not succesfull',
    });
  });

  it('should return error when both getUsage and getLimit return errors', async () => {
    const usageError = new Error('Usage fetch failed');
    const limitError = new Error('Limit fetch failed');
    const loggedError = new Error('Both requests failed');

    mockGetUsage.mockResolvedValue(left(usageError));
    mockGetLimit.mockResolvedValue(left(limitError));
    mockLogger.error.mockReturnValue(loggedError);

    const result = await getUsageAndLimit();

    expect(result.error).toBe(loggedError);
    expect(result.data).toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith({
      msg: 'getUsageAndLimit request was not succesfull',
    });
  });

  it('should return usage and limit when both requests are successful', async () => {
    const mockUsageData = { drive: 1024, backup: 512, total: 1536 };
    const mockLimitData = { maxSpaceBytes: 5120 };

    mockGetUsage.mockResolvedValue(right(mockUsageData));
    mockGetLimit.mockResolvedValue(right(mockLimitData));

    const result = await getUsageAndLimit();

    expect(result.data).toEqual({
      usageInBytes: 1536,
      limitInBytes: 5120,
    });
    expect(result.error).toBeUndefined();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('should extract total from usage data correctly', async () => {
    const mockUsageData = { drive: 2048, backup: 1024, total: 3072 };
    const mockLimitData = { maxSpaceBytes: 10240 };

    mockGetUsage.mockResolvedValue(right(mockUsageData));
    mockGetLimit.mockResolvedValue(right(mockLimitData));

    const result = await getUsageAndLimit();

    expect(result.data?.usageInBytes).toBe(3072);
    expect(result.data?.limitInBytes).toBe(10240);
  });

  it('should call both getUsage and getLimit in parallel', async () => {
    const mockUsageData = { drive: 1024, backup: 512, total: 1536 };
    const mockLimitData = { maxSpaceBytes: 5120 };

    mockGetUsage.mockResolvedValue(right(mockUsageData));
    mockGetLimit.mockResolvedValue(right(mockLimitData));

    await getUsageAndLimit();

    expect(mockGetUsage).toHaveBeenCalledTimes(1);
    expect(mockGetLimit).toHaveBeenCalledTimes(1);
  });
});
