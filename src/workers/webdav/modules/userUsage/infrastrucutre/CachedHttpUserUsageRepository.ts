import PhotosSubmodule from '@internxt/sdk/dist/photos/photos';
import { Axios } from 'axios';
import { WebdavUserUsage } from '../domain/WebdavUserUsage';
import { WebdavUserUsageRepository } from '../domain/WebdavUserUsageRepository';
import { UserUsageLimitDTO } from './dtos/UserUsageLimitDTO';

export class CachedHttpUserUsageRepository
  implements WebdavUserUsageRepository
{
  private cahdedUserUsage: WebdavUserUsage | undefined;

  constructor(
    private readonly driveClient: Axios,
    private readonly photosSubmodule: PhotosSubmodule
  ) {}

  private async getDriveUsage(): Promise<number> {
    const response = await this.driveClient.get(
      `${process.env.API_URL}/api/usage`
    );

    if (response.status !== 200) {
      throw new Error('Error retriving drive usage');
    }

    return response.data.total;
  }

  private async getLimit(): Promise<number> {
    const response = await this.driveClient.get<UserUsageLimitDTO>(
      `${process.env.API_URL}/api/limit`
    );

    if (response.status !== 200) {
      throw new Error('Error getting users usage limit');
    }

    return response.data.maxSpaceBytes as number;
  }

  async getUsage(): Promise<WebdavUserUsage> {
    if (this.cahdedUserUsage) return this.cahdedUserUsage;

    const drive = await this.getDriveUsage();
    const { usage: photos } = await this.photosSubmodule.getUsage();
    const limit = await this.getLimit();

    const usage = WebdavUserUsage.from({
      drive,
      photos,
      limit,
    });

    this.cahdedUserUsage = usage;

    return usage;
  }

  async save(usage: WebdavUserUsage) {
    this.cahdedUserUsage = usage;
  }
}
