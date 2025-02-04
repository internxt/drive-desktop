import { app } from 'electron';
import { reportError } from '../bug-report/service';
import eventBus from '../event-bus';
import { DataSource } from 'typeorm';
import { DriveFile } from './entities/DriveFile';
import { DriveFolder } from './entities/DriveFolder';
import Logger from 'electron-log';
import { ScannedItem } from './entities/ScannedItem';
const dbPath = app.getPath('appData') + '/internxt-drive/internxt_desktop.db';
export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: dbPath,
  logging: false,
  synchronize: true,
  entities: [DriveFile, DriveFolder, ScannedItem],
});

Logger.info(`Using database file at ${dbPath}`);

eventBus.on('USER_LOGGED_OUT', () => {
  AppDataSource.dropDatabase().catch((error) => {
    reportError(error);
  });
});
