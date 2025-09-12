import { DatabaseCollectionAdapter } from '../adapters/base';
import { AppDataSource } from '../data-source';
import { DriveFile } from '../entities/DriveFile';
import { Repository } from 'typeorm';
import * as Sentry from '@sentry/electron/main';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export class DriveFilesCollection
  implements DatabaseCollectionAdapter<DriveFile>
{
  private repository: Repository<DriveFile> =
    AppDataSource.getRepository('drive_file');

  async connect(): Promise<{ success: boolean }> {
    return {
      success: true,
    };
  }

  async get(uuid: DriveFile['uuid']) {
    const match = await this.repository.findOneBy({ uuid });
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

  async getAllWhere(where: Partial<DriveFile>) {
    try {
      const result = await this.repository.find({
        where,
      });

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

  async update(uuid: DriveFile['uuid'], updatePayload: Partial<DriveFile>) {
    const match = await this.repository.update(
      {
        uuid,
      },
      updatePayload
    );

    return {
      success: match.affected ? true : false,
      result: (await this.get(uuid)).result,
    };
  }

  async create(creationPayload: DriveFile) {
    const createResult = await this.repository.save(creationPayload);

    return {
      success: createResult ? true : false,
      result: createResult,
    };
  }

  async remove(uuid: DriveFile['uuid']) {
    const result = await this.repository.delete({ uuid });

    return {
      success: result.affected ? true : false,
    };
  }

  async getLastUpdated(): Promise<{
    success: boolean;
    result: DriveFile | null;
  }> {
    try {
      const queryResult = await this.repository
        .createQueryBuilder('drive_file')
        .orderBy('datetime(drive_file.updatedAt)', 'DESC')
        .getOne();

      return {
        success: true,
        result: queryResult,
      };
    } catch (error) {
      Sentry.captureException(error);
      logger.error({ msg: 'Error fetching newest drive file:', error });
      return {
        success: false,
        result: null,
      };
    }
  }
}
