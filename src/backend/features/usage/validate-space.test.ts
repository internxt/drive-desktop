import { vi } from 'vitest';
import { validateSpace } from './validate-space';
import { getRawUsageAndLimit } from './get-raw-usage-and-limit';
import { Result } from '../../../context/shared/domain/Result';
import { RawUsage } from './usage.types';

vi.mock('./get-raw-usage-and-limit', () => ({
  getRawUsageAndLimit: vi.fn(),
}));

const mockGetRawUsageAndLimit = vi.mocked(getRawUsageAndLimit);

describe('validateSpace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return hasSpace as true when enough space is available', async () => {
    const mockUsageData: RawUsage = {
      driveUsage: 1024,
      limitInBytes: 5120,
    };
    const mockResult: Result<RawUsage, Error> = { data: mockUsageData };
    mockGetRawUsageAndLimit.mockResolvedValue(mockResult);

    const result = await validateSpace(2048); // Requesting 2048 bytes when 4096 available

    expect(result.data).toEqual({ hasSpace: true });
    expect(result.error).toBeUndefined();
    expect(mockGetRawUsageAndLimit).toHaveBeenCalledTimes(1);
  });

  it('should return hasSpace as false when not enough space is available', async () => {
    const mockUsageData: RawUsage = {
      driveUsage: 3072,
      limitInBytes: 5120,
    };
    const mockResult: Result<RawUsage, Error> = { data: mockUsageData };
    mockGetRawUsageAndLimit.mockResolvedValue(mockResult);

    const result = await validateSpace(4096); // Requesting 4096 bytes when only 2048 available

    expect(result.data).toEqual({ hasSpace: false });
    expect(result.error).toBeUndefined();
    expect(mockGetRawUsageAndLimit).toHaveBeenCalledTimes(1);
  });

  it('should return hasSpace as true when requested space equals available space', async () => {
    const mockUsageData: RawUsage = {
      driveUsage: 2048,
      limitInBytes: 5120,
    };
    const mockResult: Result<RawUsage, Error> = { data: mockUsageData };
    mockGetRawUsageAndLimit.mockResolvedValue(mockResult);

    const result = await validateSpace(3072); // Requesting exactly what's available

    expect(result.data).toEqual({ hasSpace: true });
    expect(result.error).toBeUndefined();
  });

  it('should return hasSpace as false when requesting more than total limit', async () => {
    const mockUsageData: RawUsage = {
      driveUsage: 1024,
      limitInBytes: 5120,
    };
    const mockResult: Result<RawUsage, Error> = { data: mockUsageData };
    mockGetRawUsageAndLimit.mockResolvedValue(mockResult);

    const result = await validateSpace(10240); // Requesting more than total limit

    expect(result.data).toEqual({ hasSpace: false });
    expect(result.error).toBeUndefined();
  });

  it('should handle zero requested space correctly', async () => {
    const mockUsageData: RawUsage = {
      driveUsage: 5120,
      limitInBytes: 5120,
    };
    const mockResult: Result<RawUsage, Error> = { data: mockUsageData };
    mockGetRawUsageAndLimit.mockResolvedValue(mockResult);

    const result = await validateSpace(0); // Requesting 0 bytes

    expect(result.data).toEqual({ hasSpace: true });
    expect(result.error).toBeUndefined();
  });

  it('should return error when getRawUsageAndLimit returns an error', async () => {
    const mockError = new Error('Failed to get usage');
    const mockResult: Result<RawUsage, Error> = { error: mockError };
    mockGetRawUsageAndLimit.mockResolvedValue(mockResult);

    const result = await validateSpace(1024);

    expect(result.error).toBe(mockError);
    expect(result.data).toBeUndefined();
    expect(mockGetRawUsageAndLimit).toHaveBeenCalledTimes(1);
  });

  it('should return error when an unexpected error occurs', async () => {
    mockGetRawUsageAndLimit.mockRejectedValue(new Error('IPC error'));

    const result = await validateSpace(1024);

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('IPC error');
    expect(result.data).toBeUndefined();
  });

  it('should return error when a non-Error exception is thrown', async () => {
    mockGetRawUsageAndLimit.mockRejectedValue('String error');

    const result = await validateSpace(1024);

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('Failed to validate space');
    expect(result.data).toBeUndefined();
  });

  it('should calculate available space correctly', async () => {
    const mockUsageData: RawUsage = {
      driveUsage: 2000,
      limitInBytes: 10000,
    };
    const mockResult: Result<RawUsage, Error> = { data: mockUsageData };
    mockGetRawUsageAndLimit.mockResolvedValue(mockResult);

    // Available space = 10000 - 2000 = 8000
    const result1 = await validateSpace(8000);
    expect(result1.data?.hasSpace).toBe(true);

    const result2 = await validateSpace(8001);
    expect(result2.data?.hasSpace).toBe(false);
  });
});
