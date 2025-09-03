import { logger } from '@/apps/shared/logger/logger';
import { CheckpointsModule } from '@/infra/lokijs/databases/checkpoints/checkpoints.module';
import { fileRepository } from '@/infra/sqlite/services/drive-file';
import { folderRepository } from '@/infra/sqlite/services/drive-folder';
import { z } from 'zod';

const resSchema = z.array(
  z.object({
    workspaceId: z.string(),
    userUuid: z.string(),
    checkpoint: z.string().datetime(),
  }),
);

/**
 * v2.5.6 Daniel Jiménez
 * DELETE AFTER 4 MONTHS (2026-01-18)
 */
export class MoveCheckpointToLokijs {
  static readonly KEY = 'v2-5-6-move-checkpoint-to-lokijs';

  static async getFilesQueryResult() {
    return await fileRepository
      .createQueryBuilder('file')
      .select('file.userUuid', 'userUuid')
      .addSelect(
        `
    CASE 
    WHEN file.workspaceId IS NULL OR file.workspaceId = '' THEN ''
    ELSE file.workspaceId 
    END
    `,
        'workspaceId',
      )
      .addSelect('MAX(file.updatedAt)', 'checkpoint')
      .groupBy('file.userUuid')
      .addGroupBy(
        `
      CASE 
      WHEN file.workspaceId IS NULL OR file.workspaceId = '' THEN ''
      ELSE file.workspaceId 
      END
      `,
      )
      .getRawMany();
  }

  static async getFoldersQueryResult() {
    return await folderRepository
      .createQueryBuilder('folder')
      .select('folder.userUuid', 'userUuid')
      .addSelect(
        `
    CASE 
    WHEN folder.workspaceId IS NULL OR folder.workspaceId = '' THEN ''
    ELSE folder.workspaceId 
    END
    `,
        'workspaceId',
      )
      .addSelect('MAX(folder.updatedAt)', 'checkpoint')
      .groupBy('folder.userUuid')
      .addGroupBy(
        `
      CASE 
      WHEN folder.workspaceId IS NULL OR folder.workspaceId = '' THEN ''
      ELSE folder.workspaceId 
      END
      `,
      )
      .getRawMany();
  }

  static async run() {
    try {
      const files = await this.getFilesQueryResult();
      const folders = await this.getFoldersQueryResult();

      const parsedFiles = await resSchema.parseAsync(files);
      const parsedFolders = await resSchema.parseAsync(folders);

      await Promise.all(
        parsedFiles.map((item) => {
          return CheckpointsModule.updateCheckpoint({ ...item, type: 'file', plainName: '' });
        }),
      );

      await Promise.all(
        parsedFolders.map((item) => {
          return CheckpointsModule.updateCheckpoint({ ...item, type: 'folder', plainName: '' });
        }),
      );
    } catch (exc) {
      logger.error({ msg: 'Error moving checkpoint to lokijs', exc });
    }
  }
}
