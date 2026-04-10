import { electronStore } from '@/apps/main/config';
import { logger } from '@/apps/shared/logger/logger';
import { RemoveAntivirusTable } from './v2.5.7/remove-antivirus-table';
import { MoveCheckpointToSqlite } from './v2.6.3/move-checkpoint-to-sqlite';

const migrations = [RemoveAntivirusTable, MoveCheckpointToSqlite];

export async function migrate() {
  for (const migration of migrations) {
    const key = `migrations.${migration.KEY}` as const;

    if (electronStore.get(key)) continue;

    logger.debug({ msg: 'Start migration', key: migration.KEY });

    await migration.run();
    electronStore.set(key, true);

    logger.debug({ msg: 'End migration', key: migration.KEY });
  }
}
