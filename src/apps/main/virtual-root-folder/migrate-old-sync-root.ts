import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { PATHS } from '@/core/electron/paths';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { existsSync, renameSync } from 'node:fs';
import { User } from '../types';
import { configStore } from '../config';

export const OLD_SYNC_ROOT = createAbsolutePath(PATHS.HOME_FOLDER_PATH, 'InternxtDrive');

type Props = { user: User };

export function migrateOldSyncRoot({ user }: Props) {
  const newSyncRoot = createAbsolutePath(PATHS.HOME_FOLDER_PATH, `InternxtDrive - ${user.uuid}`);

  logger.debug({ msg: 'Check migrate old sync root', oldSyncRoot: OLD_SYNC_ROOT, newSyncRoot });

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
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'New sync root already exists, skiping' });
    } else if (existsSync(OLD_SYNC_ROOT)) {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Migrate old sync root' });
      renameSync(OLD_SYNC_ROOT, newSyncRoot);
    } else {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Old sync root does not exist, skiping' });
    }
  } catch (error) {
    logger.error({ tag: 'SYNC-ENGINE', msg: 'Error migrating old sync root', error });
  }

  configStore.set('syncRoot', newSyncRoot);
  return newSyncRoot;
}
