import { logger } from '@/apps/shared/logger/logger';
import { AddUserUuidToDatabase } from './v2.5.1/add-user-uuid-to-database';
import Store from 'electron-store';
import { MoveCheckpointToLokijs } from './v2.5.6/move-checkpoint-to-lokijs';
import { RemoveAntivirusTable } from './v2.5.7/remove-antivirus-table';

const store = new Store();

const migrations = [AddUserUuidToDatabase, MoveCheckpointToLokijs, RemoveAntivirusTable];

export async function migrate() {
  for (const migration of migrations) {
    const key = `migrations.${migration.KEY}`;

    if (store.get(key, false)) continue;

    logger.debug({ msg: 'Start migration', key: migration.KEY });

    await migration.run();
    store.set(key, true);

    logger.debug({ msg: 'End migration', key: migration.KEY });
  }
}
