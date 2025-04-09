import { FindOptionsWhere, Repository } from 'typeorm';
import { DriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { AppDataSource } from '@/apps/main/database/data-source';
import { getUserOrThrow } from '@/apps/main/auth/service';

type UpdateInBatchPayload = { where: FindOptionsWhere<DriveFolder>; payload: Partial<DriveFolder> };

export class DriveFolderCollection {
  private repository: Repository<DriveFolder> = AppDataSource.getRepository('drive_folder');

  private parseWhere(where: FindOptionsWhere<DriveFolder>) {
    if (!where.workspaceId) delete where.workspaceId;
    return where;
  }

  async getAll(where: FindOptionsWhere<DriveFolder>) {
    const user = getUserOrThrow();
    const result = await this.repository.findBy({
      ...this.parseWhere(where),
      userUuid: user.uuid,
    });

    return result;
  }

  async create(payload: DriveFolder) {
    const result = await this.repository.save(payload);
    return result;
  }

  async update(uuid: DriveFolder['uuid'], payload: Partial<DriveFolder>) {
    const user = getUserOrThrow();
    const match = await this.repository.update({ uuid, userUuid: user.uuid }, payload);

    return {
      success: match.affected ? true : false,
      affected: match.affected as number,
    };
  }

  async updateInBatch(input: UpdateInBatchPayload) {
    const { where, payload } = input;
    const user = getUserOrThrow();
    const match = await this.repository.update({ ...this.parseWhere(where), userUuid: user.uuid }, payload);

    return {
      success: match.affected ? true : false,
      affected: match.affected as number,
    };
  }

  async removeInBatch(where: FindOptionsWhere<DriveFolder>) {
    const user = getUserOrThrow();
    const match = await this.repository.delete({
      ...this.parseWhere(where),
      userUuid: user.uuid,
    });

    return {
      success: match.affected ? true : false,
      affected: match.affected as number,
    };
  }

  async getLastUpdated() {
    const user = getUserOrThrow();
    const result = await this.repository.findOne({
      where: { userUuid: user.uuid },
      order: { updatedAt: 'DESC' },
    });

    return result;
  }

  async getLastUpdatedByWorkspace(workspaceId: string) {
    const user = getUserOrThrow();
    const result = await this.repository.findOne({
      where: { userUuid: user.uuid, workspaceId },
      order: { updatedAt: 'DESC' },
    });

    return result;
  }
}
