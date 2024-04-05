import { DatabaseCollectionAdapter } from '../adapters/base';
import { AppDataSource } from '../data-source';
import { Repository } from 'typeorm';
import { Maintenance } from '../entities/Maintenance';

export class MaintenanceCollection
  implements DatabaseCollectionAdapter<Maintenance>
{
  private repository: Repository<Maintenance> =
    AppDataSource.getRepository('drive_folder');
  async connect(): Promise<{ success: boolean }> {
    return {
      success: true,
    };
  }
  
  async get(uuid: Maintenance['uuid']) {
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

  async update(uuid: Maintenance['uuid'], updatePayload: Partial<Maintenance>) {
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

  async create(creationPayload: Maintenance) {
    const createResult = await this.repository.save(creationPayload);

    return {
      success: createResult ? true : false,
      result: createResult,
    };
  }

  async remove(uuid: Maintenance['uuid']) {
    const result = await this.repository.delete({ uuid });

    return {
      success: result.affected ? true : false,
    };
  }
}
