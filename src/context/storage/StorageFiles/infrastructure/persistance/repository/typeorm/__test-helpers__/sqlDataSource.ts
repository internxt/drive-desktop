import path from 'node:path';
import { DataSource } from 'typeorm';
import { TypeOrmStorageFile } from '../entities/TypeOrmStorageFile';

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
