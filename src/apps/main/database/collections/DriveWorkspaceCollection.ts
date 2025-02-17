import { DatabaseCollectionAdapter } from '../adapters/base';
import { AppDataSource } from '../data-source';
import { DriveWorkspace } from '../entities/DriveWorkspace';
import { Repository } from 'typeorm';
import * as Sentry from '@sentry/electron/main';
import Logger from 'electron-log';

export class DriveWorkspaceCollection implements DatabaseCollectionAdapter<DriveWorkspace> {
  private repository: Repository<DriveWorkspace> = AppDataSource.getRepository('drive_workspace');

  async connect(): Promise<{ success: boolean }> {
    return {
      success: true,
    };
  }

  async get(id: DriveWorkspace['id']) {
    const match = await this.repository.findOneBy({ id });
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

  async update(id: DriveWorkspace['id'], updatePayload: Partial<DriveWorkspace>) {
    const match = await this.repository.update(
      {
        id,
      },
      updatePayload,
    );

    return {
      success: match.affected ? true : false,
      result: (await this.get(id)).result,
    };
  }

  async create(creationPayload: DriveWorkspace) {
    const createResult = await this.repository.save(creationPayload);

    return {
      success: createResult ? true : false,
      result: createResult,
    };
  }

  async remove(id: DriveWorkspace['id']) {
    const result = await this.repository.delete({ id });

    return {
      success: result.affected ? true : false,
    };
  }

  async getLastUpdated(): Promise<{
    success: boolean;
    result: DriveWorkspace | null;
  }> {
    try {
      const queryResult = await this.repository
        .createQueryBuilder('drive_workspace')
        .orderBy('datetime(drive_workspace.updatedAt)', 'DESC')
        .getOne();

      return {
        success: true,
        result: queryResult,
      };
    } catch (error) {
      Sentry.captureException(error);
      Logger.error('Error fetching newest drive workspace:', error);
      return {
        success: false,
        result: null,
      };
    }
  }

  async searchPartialBy(partialData: Partial<DriveWorkspace>): Promise<{ success: boolean; result: DriveWorkspace[] }> {
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
      Logger.error('Error fetching drive workspaces:', error);
      return {
        success: false,
        result: [],
      };
    }
  }
}
