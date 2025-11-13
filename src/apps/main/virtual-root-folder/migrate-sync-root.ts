import { AbsolutePath, logger } from '@internxt/drive-desktop-core/build/backend';
import { existsSync } from 'node:fs';
import { electronStore } from '../config';
import { rename } from 'node:fs/promises';

type Props = { oldSyncRoot: AbsolutePath; newSyncRoot: AbsolutePath };

export async function migrateSyncRoot({ oldSyncRoot, newSyncRoot }: Props) {
  logger.debug({ tag: 'SYNC-ENGINE', msg: 'Check migrate sync root', oldSyncRoot, newSyncRoot });

  try {
    if (existsSync(newSyncRoot)) {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'New sync root already exists, skiping' });
    } else if (existsSync(oldSyncRoot)) {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Migrate sync root' });
      await rename(oldSyncRoot, newSyncRoot);
    } else {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Old sync root does not exist, skiping' });
    }
  } catch (error) {
    logger.error({ tag: 'SYNC-ENGINE', msg: 'Error migrating sync root', error });
  }

  electronStore.set('syncRoot', newSyncRoot);
}
