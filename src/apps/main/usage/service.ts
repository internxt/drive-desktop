import { sleep } from '../util';
import { Usage } from './Usage';
import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

const INFINITE_SPACE_TRHESHOLD = 108851651149824;
const OFFER_UPGRADE_TRHESHOLD = 2199023255552;

export class UserUsageService {
  constructor(private driveServerWipModule = new DriveServerWipModule()) {}
  private async retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    let attempts = 0;
    while (attempts < retries) {
      try {
        return await fn();
      } catch (error) {
        attempts++;
        if (attempts >= retries) throw error;
        await sleep(delay);
        delay *= 2;
      }
    }
    throw new Error('Max retries reached');
  }

  private async getDriveUsage(): Promise<number> {
    return this.retry(async () => {
      const res = await this.driveServerWipModule.user.getUsage();
      if (res.error) throw res.error;
      return res.data.drive;
    });
  }

  private async getLimit(): Promise<number> {
    return this.retry(async () => {
      const res = await this.driveServerWipModule.user.getLimit();
      if (res.error) throw res.error;
      return res.data.maxSpaceBytes;
    });
  }

  async calculateUsage(): Promise<Usage> {
    const [driveUsage, limitInBytes] = await Promise.all([this.getDriveUsage(), this.getLimit()]);

    return {
      usageInBytes: driveUsage,
      limitInBytes,
      isInfinite: limitInBytes >= INFINITE_SPACE_TRHESHOLD,
      offerUpgrade: limitInBytes < OFFER_UPGRADE_TRHESHOLD,
    };
  }
  async raw() {
    const [driveUsage, limitInBytes] = await Promise.all([this.getDriveUsage(), this.getLimit()]);

    return {
      driveUsage,
      limitInBytes,
    };
  }
}
