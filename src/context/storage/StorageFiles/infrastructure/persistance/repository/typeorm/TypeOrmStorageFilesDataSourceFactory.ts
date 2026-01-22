import { DataSource } from 'typeorm';
import { TypeOrmStorageFile } from './entities/TypeOrmStorageFile';
import { app } from 'electron';

export class TypeOrmStorageFilesDataSourceFactory {
  static async create(): Promise<DataSource> {
    const dbPath = app.getPath('appData') + '/internxt-drive/internxt_desktop.db';

    const s = new DataSource({
      type: 'better-sqlite3',
      database: dbPath,
      logging: false,
      synchronize: true,
      entities: [TypeOrmStorageFile],
    });

    return s.initialize();
  }
}
