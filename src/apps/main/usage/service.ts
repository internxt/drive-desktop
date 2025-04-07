import { Usage } from './Usage';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

const INFINITE_SPACE_TRHESHOLD = 108851651149824;
const OFFER_UPGRADE_TRHESHOLD = 2199023255552;

export class UserUsageService {
  private async getDriveUsage(): Promise<number> {
    const res = await driveServerWipModule.user.getUsage();
    if (res.error) throw res.error;
    return res.data.drive;
  }

  private async getLimit(): Promise<number> {
    const res = await driveServerWipModule.user.getLimit();
    if (res.error) throw res.error;
    return res.data.maxSpaceBytes;
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
