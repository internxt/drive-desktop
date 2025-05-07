import { AppDataSource } from '../data-source';
import { Repository } from 'typeorm';
import { SCANNED_ITEMS_DB_ENTITY, ScannedItem } from '../entities/ScannedItem';

export class ScannedItemCollection {
  private repository: Repository<ScannedItem> = AppDataSource.getRepository(SCANNED_ITEMS_DB_ENTITY);

  async get(id: ScannedItem['id']) {
    const match = await this.repository.findOneBy({ id });
    return {
      success: true,
      result: match,
    };
  }

  async getByPathName(pathName: ScannedItem['pathName']) {
    const match = await this.repository.findOneBy({ pathName });
    return {
      success: true,
      result: match,
    };
  }

  async update(id: ScannedItem['id'], updatePayload: Partial<ScannedItem>) {
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

  async create(creationPayload: ScannedItem) {
    const createResult = await this.repository.save(creationPayload);

    return {
      success: createResult ? true : false,
      result: createResult,
    };
  }
}
