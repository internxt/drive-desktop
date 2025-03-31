import { DatabaseCollectionAdapter } from '../adapters/base';
import { AppDataSource } from '../data-source';
import { DriveFile } from '../entities/DriveFile';
import { FindOptionsWhere, Repository } from 'typeorm';
import { logger } from '@/apps/shared/logger/logger';

type UpdateInBatchPayload = { where: FindOptionsWhere<DriveFile>; updatePayload: Partial<DriveFile> };
export class DriveFilesCollection implements DatabaseCollectionAdapter<DriveFile> {
  private repository: Repository<DriveFile> = AppDataSource.getRepository('drive_file');

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

  async getAll(workspaceId: string | undefined) {
    try {
      const where: FindOptionsWhere<DriveFile> = {};
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

  async updateInBatch(input: UpdateInBatchPayload) {
    const { where, updatePayload } = input;
    const match = await this.repository.update(where, updatePayload);

    return {
      success: match.affected ? true : false,
    };
  }

  async getAllByFolder({ folderUuid, workspaceId }: { folderUuid: string; workspaceId?: string }) {
    try {
      const where: FindOptionsWhere<DriveFile> = { folderUuid };
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

  async update(uuid: DriveFile['uuid'], updatePayload: Partial<DriveFile>) {
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

  async removeInBatch(where: FindOptionsWhere<DriveFile>) {
    const result = await this.repository.delete(where);

    return {
      success: result.affected ? true : false,
    };
  }

  async getLastUpdated(): Promise<{
    success: boolean;
    result: DriveFile | null;
  }> {
    try {
      const queryResult = await this.repository.createQueryBuilder('drive_file').orderBy('datetime(drive_file.updatedAt)', 'DESC').getOne();

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

  async getLastUpdatedByWorkspace(workspaceId: string): Promise<{ success: boolean; result: DriveFile | null }> {
    try {
      const queryResult = await this.repository
        .createQueryBuilder('drive_file')
        .where('workspaceId = :workspaceId', { workspaceId })
        .orderBy('datetime(drive_file.updatedAt)', 'DESC')
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

  async searchPartialBy(partialData: Partial<DriveFile>): Promise<{ success: boolean; result: DriveFile[] }> {
    try {
      logger.debug({
        msg: 'Searching drive files by partial data',
        partialData,
      });
      const result = await this.repository.find({
        where: partialData,
      });
      return {
        success: true,
        result,
      };
    } catch (exc) {
      logger.warn({
        msg: 'Error searching drive files by partial data',
        exc,
      });
      return {
        success: false,
        result: [],
      };
    }
  }
}
