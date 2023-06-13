import { app } from 'electron';
import { reportError } from '../bug-report/service';
import eventBus from '../event-bus';
import { DataSource } from 'typeorm';
import Logger from 'electron-log';
import { DriveFile } from './entities/DriveFile';
import { DriveFolder } from './entities/DriveFolder';

Logger.info('Dirname ', __dirname);
export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: app.getPath('appData') + '/internxt-drive/internxt_desktop.db',
  logging: true,
  synchronize: true,
  entities: [DriveFile, DriveFolder],
});

eventBus.on('USER_LOGGED_OUT', () => {
  AppDataSource.dropDatabase().catch((error) => {
    reportError(error);
  });
});
