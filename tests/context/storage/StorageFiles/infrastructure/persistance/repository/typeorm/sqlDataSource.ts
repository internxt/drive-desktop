import path from 'path';
import { DataSource } from '../../../../../../../../src/apps/node_modules/typeorm';
import { TypeOrmStorageFile } from '../../../../../../../../src/context/storage/StorageFiles/infrastructure/persistance/repository/typeorm/entities/TypeOrmStorageFile';

export function obtainSqliteDataSource(directory: string): Promise<DataSource> {
  const database = path.join(directory, 'test_storage_file.db');

  const s = new DataSource({
    type: 'better-sqlite3',
    database,
    logging: false,
    synchronize: true,
    entities: [TypeOrmStorageFile],
  });

  return s.initialize();
}
