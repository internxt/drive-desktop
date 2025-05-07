import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserUsageService } from './service';
import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { mockDeep } from 'vitest-mock-extended';

const driveServerWipModule = mockDeep<DriveServerWipModule>();

describe('UserUsageService', () => {
  let service: UserUsageService;

  beforeEach(() => {
    service = new UserUsageService(driveServerWipModule);
    vi.clearAllMocks();
  });

  it('should calculate usage correctly', async () => {
    vi.mocked(driveServerWipModule.user.getUsage).mockResolvedValue({ data: { drive: 5000 }, error: undefined });
    vi.mocked(driveServerWipModule.user.getLimit).mockResolvedValue({ data: { maxSpaceBytes: 10000 }, error: undefined });

    const result = await service.calculateUsage();

    expect(result).toEqual({
      usageInBytes: 5000,
      limitInBytes: 10000,
      isInfinite: false,
      offerUpgrade: true,
    });
    expect(driveServerWipModule.user.getUsage).toHaveBeenCalledTimes(1);
    expect(driveServerWipModule.user.getLimit).toHaveBeenCalledTimes(1);
  });

  it('should handle infinite space threshold', async () => {
    driveServerWipModule.user.getUsage.mockResolvedValue({ data: { drive: 5000 }, error: undefined });
    driveServerWipModule.user.getLimit.mockResolvedValue({ data: { maxSpaceBytes: 108851651149824 }, error: undefined });

    const result = await service.calculateUsage();

    expect(result.isInfinite).toBe(true);
    expect(result.offerUpgrade).toBe(false);
  });

  it('should retry on failure and succeed', async () => {
    let attempts = 0;
    driveServerWipModule.user.getUsage.mockImplementation(async () => {
      attempts++;
      if (attempts < 3) throw new Error('Temporary error');
      return await { data: { drive: 5000 }, error: undefined };
    });
    driveServerWipModule.user.getLimit.mockResolvedValue({ data: { maxSpaceBytes: 10000 }, error: undefined });

    const result = await service.calculateUsage();

    expect(result.usageInBytes).toBe(5000);
    expect(attempts).toBe(3);
  });

  it('should throw an error after max retries', async () => {
    driveServerWipModule.user.getUsage.mockRejectedValue(new Error('Permanent error'));
    driveServerWipModule.user.getLimit.mockResolvedValue({ data: { maxSpaceBytes: 10000 }, error: undefined });

    await expect(service.calculateUsage()).rejects.toThrow('Permanent error');
    expect(driveServerWipModule.user.getUsage).toHaveBeenCalledTimes(3);
  });

  it('should return raw usage data', async () => {
    driveServerWipModule.user.getUsage.mockResolvedValue({ data: { drive: 7000 }, error: undefined });
    driveServerWipModule.user.getLimit.mockResolvedValue({ data: { maxSpaceBytes: 15000 }, error: undefined });

    const result = await service.raw();

    expect(result).toEqual({
      driveUsage: 7000,
      limitInBytes: 15000,
    });
  });
});
