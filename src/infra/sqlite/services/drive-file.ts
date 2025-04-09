import { FindOptionsWhere, Repository } from 'typeorm';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { AppDataSource } from '@/apps/main/database/data-source';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { logger } from '@/apps/shared/logger/logger';

type UpdateInBatchPayload = { where: FindOptionsWhere<DriveFile>; payload: Partial<DriveFile> };

export class DriveFileCollection {
  private repository: Repository<DriveFile> = AppDataSource.getRepository('drive_file');

  private parseWhere(where: FindOptionsWhere<DriveFile>) {
    if (!where.workspaceId) delete where.workspaceId;
    return where;
  }

  async getAll(where: FindOptionsWhere<DriveFile>) {
    const user = getUserOrThrow();
    const result = await this.repository.findBy({
      ...this.parseWhere(where),
      userUuid: user.uuid,
    });

    return result;
  }

  async getByContentsId(contentsId: DriveFile['fileId']) {
    const user = getUserOrThrow();
    const result = await this.repository.findOneBy({
      fileId: contentsId,
      userUuid: user.uuid,
    });

    return result;
  }

  async create(payload: DriveFile) {
    const result = await this.repository.save(payload);
    return result;
  }

  async update(uuid: DriveFile['uuid'], payload: Partial<DriveFile>) {
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

  async removeInBatch(where: FindOptionsWhere<DriveFile>) {
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
