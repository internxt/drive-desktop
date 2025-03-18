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
  AppDataSource.dropDatabase().catch((error) => {
    reportError(error);
  });
  logger.debug({
    msg: 'Database destroyed',
  });
};
