import { AbsolutePath, logger } from '@internxt/drive-desktop-core/build/backend';
import { existsSync, renameSync } from 'node:fs';
import { configStore } from '../config';

type Props = { oldSyncRoot: AbsolutePath; newSyncRoot: AbsolutePath };

export function migrateSyncRoot({ oldSyncRoot, newSyncRoot }: Props) {
  logger.debug({ msg: 'Check migrate sync root', oldSyncRoot, newSyncRoot });

  /**
   * v2.5.1 Jonathan Arce
   * Previously, the drive name in Explorer was "InternxtDrive" and when you logged out and logged in,
   * you would delete the folder and recreate it. However, if some files weren't synced, deleting the folder
   * would cause them to be lost. Now, we won't delete the folder; instead, we'll create a new drive for each
   * login called "InternxtDrive - {user.uuid}."
   * So, we need to rename "InternxtDrive" to "InternxtDrive - {user.uuid}".
   */

  try {
    if (existsSync(newSyncRoot)) {
      logger.debug({ msg: 'New sync root already exists, skiping' });
    } else if (existsSync(oldSyncRoot)) {
      logger.debug({ msg: 'Migrate old sync root' });
      renameSync(oldSyncRoot, newSyncRoot);
    } else {
      logger.debug({ msg: 'Old sync root does not exist, skiping' });
    }
  } catch (error) {
    logger.error({ msg: 'Error migrating old sync root', error });
  }

  configStore.set('syncRoot', newSyncRoot);
  return newSyncRoot;
}
