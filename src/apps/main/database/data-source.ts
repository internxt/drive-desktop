/* eslint-disable no-await-in-loop */
import { app } from 'electron';
import { DataSource } from 'typeorm';
import { DriveFile } from './entities/DriveFile';
import { DriveFolder } from './entities/DriveFolder';
import { ScannedItem } from './entities/ScannedItem';
import { DriveWorkspace } from './entities/DriveWorkspace';
import { logger } from '@/apps/shared/logger/logger';
const dbPath = app.getPath('appData') + '/internxt-drive/internxt_desktop.db';
export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: dbPath,
  logging: false,
  synchronize: true,
  entities: [DriveFile, DriveFolder, ScannedItem, DriveWorkspace],
});

logger.debug({
  msg: `Using database file at ${dbPath}`,
});

export const destroyDatabase = async () => {
  try {
    // Clear all tables instead of dropping the database
    await AppDataSource.getRepository(DriveFile).clear();
    await AppDataSource.getRepository(DriveFolder).clear();
    await AppDataSource.getRepository(DriveWorkspace).clear();

    logger.debug({
      msg: 'All table contents cleared',
    });
  } catch (error) {
    logger.warn({
      msg: 'Error clearing database',
      exc: error,
    });
  }
};
