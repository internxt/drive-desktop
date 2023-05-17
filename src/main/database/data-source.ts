import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: 'internxt_desktop.db',
  logging: true,
  synchronize: true,
  entities: [__dirname + '/entities/*.ts'],
});
