import { DatabaseCollectionAdapter } from '../adapters/base';
import { AppDataSource } from '../data-source';
import { Repository } from 'typeorm';
import * as Sentry from '@sentry/electron/main';
import Logger from 'electron-log';
import { FileSystemHashed } from '../entities/FileSystemHashed';

export class HashedSystemTreeCollection
  implements DatabaseCollectionAdapter<FileSystemHashed>
{
  private repository: Repository<FileSystemHashed> =
    AppDataSource.getRepository('hashed_files');

  async connect(): Promise<{ success: boolean }> {
    return {
      success: true,
    };
  }

  async get(id: FileSystemHashed['id']) {
    const match = await this.repository.findOneBy({ id });
    return {
      success: true,
      result: match,
    };
  }

  async getByPathName(pathName: FileSystemHashed['pathName']) {
    const match = await this.repository.findOneBy({ pathName });
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

  async update(
    id: FileSystemHashed['id'],
    updatePayload: Partial<FileSystemHashed>
  ) {
    const match = await this.repository.update(
      {
        id,
      },
      updatePayload
    );

    return {
      success: match.affected ? true : false,
      result: (await this.get(id)).result,
    };
  }

  async create(creationPayload: FileSystemHashed) {
    const createResult = await this.repository.save(creationPayload);

    return {
      success: createResult ? true : false,
      result: createResult,
    };
  }

  async remove(id: FileSystemHashed['id']) {
    const result = await this.repository.delete({ id });

    return {
      success: result.affected ? true : false,
    };
  }

  async getLastUpdated(): Promise<{
    success: boolean;
    result: FileSystemHashed | null;
  }> {
    try {
      const queryResult = await this.repository
        .createQueryBuilder('hashed_files')
        .orderBy('datetime(hashed_files.updatedAt)', 'DESC')
        .getOne();

      return {
        success: true,
        result: queryResult,
      };
    } catch (error) {
      Sentry.captureException(error);
      Logger.error('Error fetching newest drive file:', error);
      return {
        success: false,
        result: null,
      };
    }
  }

  async searchPartialBy(
    partialData: Partial<FileSystemHashed>
  ): Promise<{ success: boolean; result: FileSystemHashed[] }> {
    try {
      Logger.info('Searching partial by', partialData);
      const result = await this.repository.find({
        where: partialData,
      });
      return {
        success: true,
        result,
      };
    } catch (error) {
      Sentry.captureException(error);
      Logger.error('Error fetching drive folders:', error);
      return {
        success: false,
        result: [],
      };
    }
  }
}
