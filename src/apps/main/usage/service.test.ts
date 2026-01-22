import { DriveServerWipError } from '@/infra/drive-server-wip/defs';
import { calculateUsage } from './service';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('UserUsageService', () => {
  const getUsageMock = vi.mocked(driveServerWip.user.getUsage);
  const getLimitMock = vi.mocked(driveServerWip.user.getLimit);

  it('should calculate usage correctly', async () => {
    getUsageMock.mockResolvedValueOnce({ data: { drive: 5000, backup: 1000, total: 6000 } });
    getLimitMock.mockResolvedValueOnce({ data: { maxSpaceBytes: 10000 } });

    const result = await calculateUsage();

    expect(result).toEqual({
      usageInBytes: 5000,
      limitInBytes: 10000,
      isInfinite: false,
      offerUpgrade: true,
    });
  });

  it('should handle infinite space threshold', async () => {
    getUsageMock.mockResolvedValueOnce({ data: { drive: 5000, backup: 1000, total: 6000 } });
    getLimitMock.mockResolvedValueOnce({ data: { maxSpaceBytes: 108851651149824 } });

    const result = await calculateUsage();

    expect(result.isInfinite).toBe(true);
    expect(result.offerUpgrade).toBe(false);
  });

  it('should throw an error', async () => {
    getUsageMock.mockResolvedValueOnce({ error: new DriveServerWipError('UNKNOWN', 'cause') });
    getLimitMock.mockResolvedValueOnce({ data: { maxSpaceBytes: 10000 } });

    await expect(calculateUsage()).rejects.toThrow('UNKNOWN');
  });
});
