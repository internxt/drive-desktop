import { DatabaseCollectionAdapter } from '../adapters/base';
import { AppDataSource } from '../data-source';
import { Repository } from 'typeorm';
import * as Sentry from '@sentry/electron/main';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { SCANNED_ITEMS_DB_ENTITY, ScannedItem } from '../entities/ScannedItem';

export class ScannedItemCollection
  implements DatabaseCollectionAdapter<ScannedItem>
{
  private repository: Repository<ScannedItem> = AppDataSource.getRepository(
    SCANNED_ITEMS_DB_ENTITY
  );

  async connect(): Promise<{ success: boolean }> {
    return {
      success: true,
    };
  }

  async get(id: ScannedItem['id']) {
    const match = await this.repository.findOneBy({ id });

    if (!match) {
      return {
        success: false,
        result: null,
        message: 'Item not found',
      };
    }

    return {
      success: true,
      result: match,
    };
  }

  async getByPathName(pathName: ScannedItem['pathName']) {
    const match = await this.repository.findOneBy({ pathName });

    if (!match) {
      return {
        success: false,
        result: null,
        message: 'Item not found',
      };
    }

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
      Sentry.captureException(error);
      logger.error({ msg: 'Error getting all DB items:', error });
      return {
        success: false,
        result: [],
      };
    }
  }

  async update(id: ScannedItem['id'], updatePayload: Partial<ScannedItem>) {
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

  async create(creationPayload: ScannedItem) {
    const createResult = await this.repository.save(creationPayload);

    return {
      success: createResult ? true : false,
      result: createResult,
    };
  }

  async remove(id: ScannedItem['id']) {
    const result = await this.repository.delete({ id });

    return {
      success: result.affected ? true : false,
    };
  }

  async getLastUpdated(): Promise<{
    success: boolean;
    result: ScannedItem | null;
  }> {
    try {
      const queryResult = await this.repository
        .createQueryBuilder(SCANNED_ITEMS_DB_ENTITY)
        .orderBy(`datetime(${SCANNED_ITEMS_DB_ENTITY}.updatedAt)`, 'DESC')
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

  async searchPartialBy(
    partialData: Partial<ScannedItem>
  ): Promise<{ success: boolean; result: ScannedItem[] }> {
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
      logger.error({ msg: 'Error fetching drive folders:', error });
      return {
        success: false,
        result: [],
      };
    }
  }
}
