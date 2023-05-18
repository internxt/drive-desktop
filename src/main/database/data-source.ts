import { app } from 'electron';
import { DataSource } from 'typeorm';
import Logger from 'electron-log';
Logger.info(
  'DB',
  app.getPath('appData') + '/internxt-drive/internxt_desktop.db'
);
export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: app.getPath('appData') + '/internxt-drive/internxt_desktop.db',
  logging: true,
  synchronize: true,
  entities: [__dirname + '/entities/*.ts'],
});
