import { logger } from '@/apps/shared/logger/logger';
import { PATHS } from '@/core/electron/paths';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';

const SCHEMA = z.object({
  collections: z.array(
    z.object({
      name: z.literal('checkpoints'),
      data: z.array(z.object({ key: z.string(), checkpoint: z.string() })),
    }),
  ),
});

export class MoveCheckpointToSqlite {
  static readonly KEY = 'v2-6-3-move-checkpoint-to-sqlite';

  static async run() {
    try {
      const file = await readFile(PATHS.LOKIJS_DB, 'utf-8');
      const data = await SCHEMA.parseAsync(JSON.parse(file));

      await Promise.all(
        data.collections.map((collection) => {
          return collection.data.map(({ key, checkpoint }) => {
            const [userUuid, workspaceId, type] = key.split(':');

            return SqliteModule.CheckpointModule.createOrUpdate({
              name: '',
              updatedAt: checkpoint,
              type: type as 'file' | 'folder',
              userUuid,
              workspaceId,
            });
          });
        }),
      );
    } catch (error) {
      logger.error({ msg: 'Error moving checkpoint to sqlite', error });
    }
  }
}
