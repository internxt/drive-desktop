import { DatabaseCollectionAdapter } from '../adapters/base';
import { DriveThumbnail } from '../entities/DriveThumbnail';
import { AppDataSource } from '../data-source';
import { Repository } from 'typeorm';
import Logger from 'electron-log';

export class DriveThumbnailsCollection
  implements DatabaseCollectionAdapter<DriveThumbnail>
{
  private repository: Repository<DriveThumbnail> =
    AppDataSource.getRepository('drive_thumbnail');

  async connect(): Promise<{ success: boolean }> {
    return {
      success: true,
    };
  }

  async get(
    bucketFile: DriveThumbnail['bucketFile']
  ): Promise<{ success: boolean; result: DriveThumbnail | null }> {
    const match = await this.repository.findOneBy({ bucketFile });
    return {
      success: true,
      result: match,
    };
  }

  async getAll() {
    try {
      const result = await this.repository.find();
      return {
        success: true,
        result: result,
      };
    } catch (error) {
      return {
        success: false,
        result: [],
      };
    }
  }

  update(
    _itemId: string,
    _updatePayload: Partial<DriveThumbnail>
  ): Promise<{ success: boolean; result: DriveThumbnail | null }> {
    throw new Error('Method not implemented.');
  }

  async create(
    creationPayload: DriveThumbnail
  ): Promise<{ success: boolean; result: DriveThumbnail | null }> {
    Logger.debug('INSERTING THUMBNAIL');
    const createResult = await this.repository.save(creationPayload);

    return {
      success: createResult ? true : false,
      result: createResult,
    };
  }
  remove(_itemId: string): Promise<{ success: boolean }> {
    throw new Error('Method not implemented.');
  }
}
