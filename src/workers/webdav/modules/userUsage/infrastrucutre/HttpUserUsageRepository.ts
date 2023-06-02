import PhotosSubmodule from '@internxt/sdk/dist/photos/photos';
import { Axios } from 'axios';
import { UserUsage } from '../domain/UserUsage';
import { UserUsageRepository } from '../domain/UserUsageRepository';
import { UserUsageLimitDTO } from './dtos/UserUsageLimitDTO';

export class HttpUserUsageRepository implements UserUsageRepository {
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

  async getUsage(): Promise<UserUsage> {
    const drive = await this.getDriveUsage();
    const { usage: photos } = await this.photosSubmodule.getUsage();
    const limit = await this.getLimit();

    return UserUsage.from({
      drive,
      photos,
      limit,
    });
  }
}
