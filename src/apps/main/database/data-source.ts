import { DataSource } from 'typeorm';
import { DriveFile } from './entities/DriveFile';
import { DriveFolder } from './entities/DriveFolder';
import { PATHS } from '@/core/electron/paths';

/**
 * v2.5.1 Daniel Jiménez
 * Do not delete or clear the DriveFile and DriveFolder tables since we are keeping the folder itself.
 * Otherwise we will lose the checkpoint and the current status of files and folders.
 */

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: PATHS.SQLITE_DB,
  logging: false,
  synchronize: true,
  entities: [DriveFile, DriveFolder],
});
