import { DatabaseCollectionAdapter } from '../adapters/base';
import { AppDataSource } from '../data-source';
import { DriveFolder } from '../entities/DriveFolder';
import { FindOptionsWhere, Repository } from 'typeorm';
import { logger } from '@/apps/shared/logger/logger';

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
  async getAllByFolder({ parentUuid, workspaceId }: { parentUuid: string; workspaceId?: string }) {
    try {
      const where: FindOptionsWhere<DriveFolder> = { parentUuid };
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
    } catch (exc) {
      logger.warn({
        msg: 'Error fetching newest drive folder:',
        exc,
      });
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
    } catch (exc) {
      logger.warn({
        msg: 'Error fetching newest drive folder:',
        exc,
      });
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
    } catch (exc) {
      logger.warn({
        msg: 'Error fetching drive folders:',
        exc,
      });
      return {
        success: false,
        result: [],
      };
    }
  }

  async cleanWorkspace(workspaceId: string): Promise<{ success: boolean }> {
    try {
      await this.repository.delete({ workspaceId });
      return {
        success: true,
      };
    } catch (exc) {
      logger.warn({
        msg: 'Error cleaning workspace',
        workspaceId,
        exc,
      });
      return {
        success: false,
      };
    }
  }
}
