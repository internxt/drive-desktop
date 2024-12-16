import { Storage } from '@internxt/sdk/dist/drive';
import { RawUsage, Usage } from './Usage';
const INFINITE_SPACE_TRHESHOLD = 108851651149824 as const;
const OFFER_UPGRADE_TRHESHOLD = 2199023255552 as const;

export class UserUsageService {
  constructor(private readonly storage: Storage) {}

  public async getDriveUsage(): Promise<number> {
    const usage = await this.storage.spaceUsage();

    return usage.total;
  }

  private async getLimit(): Promise<number> {
    const { maxSpaceBytes } = await this.storage.spaceLimit();

    return maxSpaceBytes;
  }

  async calculateUsage(): Promise<Usage> {
    const [driveUsage, limitInBytes] = await Promise.all([
      this.getDriveUsage(),
      this.getLimit(),
    ]);

    return {
      usageInBytes: driveUsage,
      limitInBytes,
      isInfinite: limitInBytes >= INFINITE_SPACE_TRHESHOLD,
      offerUpgrade: limitInBytes < OFFER_UPGRADE_TRHESHOLD,
    };
  }

  async raw(): Promise<RawUsage> {
    const [driveUsage, limitInBytes] = await Promise.all([
      this.getDriveUsage(),
      this.getLimit(),
    ]);

    return {
      driveUsage,
      limitInBytes,
    };
  }
}
