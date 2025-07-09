import { FindOptionsWhere, Repository } from 'typeorm';
import { DriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { AppDataSource } from '@/apps/main/database/data-source';
import { getUserOrThrow } from '@/apps/main/auth/service';

export const repository: Repository<DriveFolder> = AppDataSource.getRepository('drive_folder');

type UpdateInBatchPayload = { where: FindOptionsWhere<DriveFolder>; payload: Partial<DriveFolder> };

export class DriveFolderCollection {
  parseWhere(where: FindOptionsWhere<DriveFolder>) {
    /**
     * v2.5.1 Daniel Jiménez
     * The database stores workspaceId as null if the file is not in any workspace.
     * However, because of legacy code we are using also the empty string in some places.
     * To be careful, we are deleting the workspaceId if it is empty.
     */
    if (!where.workspaceId) delete where.workspaceId;
    return where;
  }

  async getAll(where: FindOptionsWhere<DriveFolder>) {
    const user = getUserOrThrow();
    const result = await repository.findBy({
      ...this.parseWhere(where),
      userUuid: user.uuid,
    });

    return result;
  }

  async createOrUpdate(payload: DriveFolder) {
    const result = await repository.save(payload);
    return result;
  }

  async updateInBatch(input: UpdateInBatchPayload) {
    const { where, payload } = input;
    const user = getUserOrThrow();
    const match = await repository.update({ ...this.parseWhere(where), userUuid: user.uuid }, payload);

    return {
      success: match.affected ? true : false,
      affected: match.affected as number,
    };
  }

  async getLastUpdatedByWorkspace({ userUuid, workspaceId }: { userUuid: string; workspaceId: string }) {
    const result = await repository.findOne({
      where: { userUuid, workspaceId },
      order: { updatedAt: 'DESC' },
    });

    return result;
  }
}
