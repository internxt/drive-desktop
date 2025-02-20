import { DatabaseCollectionAdapter } from '../adapters/base';
import { AppDataSource } from '../data-source';
import { DriveFolder } from '../entities/DriveFolder';
import { FindOptionsWhere, Repository } from 'typeorm';
import * as Sentry from '@sentry/electron/main';
import Logger from 'electron-log';

export class DriveFoldersCollection implements DatabaseCollectionAdapter<DriveFolder> {
  private repository: Repository<DriveFolder> = AppDataSource.getRepository('drive_folder');
  async connect(): Promise<{ success: boolean }> {
    return {
      success: true,
    };
  }

  async get(uuid: DriveFolder['uuid']) {
    const match = await this.repository.findOneBy({ uuid });
    return {
      success: true,
      result: match,
    };
  }

  async getAll(workspaceId?: string) {
    try {
      const where: FindOptionsWhere<DriveFolder> = {};
      if (workspaceId) {
        where.workspaceId = workspaceId;
      }

      const result = await this.repository.find({ where });
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
  async getAllByFolder(parentId: number, workspaceId?: string) {
    try {
      const where: FindOptionsWhere<DriveFolder> = { parentId };
      if (workspaceId) {
        where.workspaceId = workspaceId;
      }

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

  async update(uuid: DriveFolder['uuid'], updatePayload: Partial<DriveFolder>) {
    const match = await this.repository.update(
      {
        uuid,
      },
      updatePayload,
    );

    return {
      success: match.affected ? true : false,
      result: (await this.get(uuid)).result,
    };
  }

  async create(creationPayload: DriveFolder) {
    const createResult = await this.repository.save(creationPayload);

    return {
      success: createResult ? true : false,
      result: createResult,
    };
  }

  async remove(uuid: DriveFolder['uuid']) {
    const result = await this.repository.delete({ uuid });

    return {
      success: result.affected ? true : false,
    };
  }

  async getLastUpdated(): Promise<{
    success: boolean;
    result: DriveFolder | null;
  }> {
    try {
      const queryResult = await this.repository
        .createQueryBuilder('drive_folder')
        .orderBy('datetime(drive_folder.updatedAt)', 'DESC')
        .getOne();

      return {
        success: true,
        result: queryResult,
      };
    } catch (error) {
      Sentry.captureException(error);
      Logger.error('Error fetching newest drive folder:', error);
      return {
        success: false,
        result: null,
      };
    }
  }

  async getLastUpdatedByWorkspace(workspaceId: string): Promise<{ success: boolean; result: DriveFolder | null }> {
    try {
      const queryResult = await this.repository
        .createQueryBuilder('drive_folder')
        .where('workspaceId = :workspaceId', { workspaceId })
        .orderBy('datetime(drive_folder.updatedAt)', 'DESC')
        .getOne();

      return {
        success: true,
        result: queryResult,
      };
    } catch (error) {
      Sentry.captureException(error);
      Logger.error('Error fetching newest drive folder:', error);
      return {
        success: false,
        result: null,
      };
    }
  }

  async searchPartialBy(partialData: Partial<DriveFolder>): Promise<{ success: boolean; result: DriveFolder[] }> {
    try {
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
