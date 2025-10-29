import { AbsolutePath, logger } from '@internxt/drive-desktop-core/build/backend';
import { existsSync, renameSync } from 'node:fs';
import { configStore } from '../config';

type Props = { oldSyncRoot: AbsolutePath; newSyncRoot: AbsolutePath };

export function migrateSyncRoot({ oldSyncRoot, newSyncRoot }: Props) {
  logger.debug({ msg: 'Check migrate sync root', oldSyncRoot, newSyncRoot });

  try {
    if (existsSync(newSyncRoot)) {
      logger.debug({ msg: 'New sync root already exists, skiping' });
    } else if (existsSync(oldSyncRoot)) {
      logger.debug({ msg: 'Migrate old sync root' });
      renameSync(oldSyncRoot, newSyncRoot);
    } else {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Old sync root does not exist, skiping' });
    }
  } catch (error) {
    logger.error({ tag: 'SYNC-ENGINE', msg: 'Error migrating old sync root', error });
  }

  configStore.set('syncRoot', newSyncRoot);
  return newSyncRoot;
}
