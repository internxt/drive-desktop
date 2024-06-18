import { Storage } from '@internxt/sdk/dist/drive';
import PhotosSubmodule from '@internxt/sdk/dist/photos/photos';
import { RawUsage, Usage } from './Usage';
const INFINITE_SPACE_TRHESHOLD = 108851651149824 as const;
const OFFER_UPGRADE_TRHESHOLD = 2199023255552 as const;

export class UserUsageService {
  constructor(
    private readonly storage: Storage,
    private readonly photos: PhotosSubmodule
  ) {}

  private async getPhotosUsage(): Promise<number> {
    const { usage } = await this.photos.getUsage();
    return usage;
  }

  public async getDriveUsage(): Promise<number> {
    const usage = await this.storage.spaceUsage();

    return usage.total;
  }

  private async getLimit(): Promise<number> {
    const { maxSpaceBytes } = await this.storage.spaceLimit();

    return maxSpaceBytes;
  }

  async calculateUsage(): Promise<Usage> {
    const [driveUsage, photosUsage, limitInBytes] = await Promise.all([
      this.getDriveUsage(),
      this.getPhotosUsage(),
      this.getLimit(),
    ]);

    return {
      usageInBytes: driveUsage + photosUsage,
      limitInBytes,
      isInfinite: limitInBytes >= INFINITE_SPACE_TRHESHOLD,
      offerUpgrade: limitInBytes < OFFER_UPGRADE_TRHESHOLD,
    };
  }

  async raw(): Promise<RawUsage> {
    const [driveUsage, photosUsage, limitInBytes] = await Promise.all([
      this.getDriveUsage(),
      this.getPhotosUsage(),
      this.getLimit(),
    ]);

    return {
      driveUsage,
      photosUsage,
      limitInBytes,
    };
  }
}
