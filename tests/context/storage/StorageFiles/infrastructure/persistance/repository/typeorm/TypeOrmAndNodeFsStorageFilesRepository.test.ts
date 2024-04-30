import path from 'path';
import { DataSource } from '../../../../../../../../src/apps/node_modules/typeorm';
import { TypeOrmAndNodeFsStorageFilesRepository } from '../../../../../../../../src/context/storage/StorageFiles/infrastructure/persistance/repository/typeorm/TypeOrmAndNodeFsStorageFilesRepository';
import { obtainSqliteDataSource } from './sqlDataSource';
import { StorageFileMother } from '../../../../domain/StorageFileMother';
import { createReadable } from './createReadable';
import { createFile } from '../fixtures/createFile';

describe('TypeOrmAndNodeFsStorageFilesRepository', () => {
  const directory = 'sqlite';

  let dataSource: DataSource;
  let repository: TypeOrmAndNodeFsStorageFilesRepository;

  beforeAll(async () => {
    const on = path.join(__dirname, directory);

    dataSource = await obtainSqliteDataSource(on);

    repository = new TypeOrmAndNodeFsStorageFilesRepository(on, dataSource);
  });

  afterAll(async () => {
    await dataSource?.dropDatabase();
  });

  afterEach(async () => {
    await repository.deleteAll();
  });

  it('stores and retrieve a file from database and file system', async () => {
    const file = StorageFileMother.random();
    const content = 'Hello Wold!!';

    await repository.store(file, createReadable(content));

    const retrievedBuffer = await repository.read(file.id);

    expect(retrievedBuffer.toString()).toBe(content);
  });

  it('deletes a stored file', async () => {
    const file = await createFile(repository);

    await repository.delete(file.id);

    const result = await repository.exists(file.id);

    expect(result).toBe(false);
  });

  it('finds a file after being stored', async () => {
    const stored = await createFile(repository);

    const exists = await repository.exists(stored.id);

    expect(exists).toBe(true);
  });

  it('retrieves a stored Storage File', async () => {
    const stored = await createFile(repository);

    const retrieved = await repository.retrieve(stored.id);

    expect(stored).toEqual(retrieved);
  });

  it('returns all files', async () => {
    const files = await Promise.all([
      createFile(repository),
      createFile(repository),
      createFile(repository),
    ]);

    const allFilesRetrieved = await repository.all();

    expect(files).toEqual(allFilesRetrieved);
  });
});
