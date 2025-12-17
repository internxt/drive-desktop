// import 'reflect-metadata';
// import path from 'node:path';
// import { DataSource } from '../../../../../../../apps/node_modules/typeorm';
// import { TypeOrmAndNodeFsStorageFilesRepository } from './TypeOrmAndNodeFsStorageFilesRepository';
// import { obtainSqliteDataSource } from './__test-helpers__/sqlDataSource';
// import { StorageFileMother } from '../../../../../__test-helpers__/StorageFileMother';
// import { createReadable } from './__test-helpers__/createReadable';
// import { createFile } from './__test-helpers__/createFile';

/**
 * SKIPPED: This test requires better-sqlite3 native module which must be compiled
 * for the specific Node.js version being used.
 *
 * The production app runs on Node.js v16 (NODE_MODULE_VERSION 106), but if you're
 * running tests with a different Node version, better-sqlite3 will fail to load.
 *
 * ADDITIONAL ISSUE: typeorm and better-sqlite3 are installed in release/app/package.json
 * (separate from the main package.json), which creates module resolution issues in the
 * test environment. The proper solution is to consolidate into a single package.json.
 *
 * To fix:
 * 1. Use Node.js v16 to match production: `nvm use 16`
 * 2. Or rebuild the native module: `npm rebuild better-sqlite3`
 * 3. Or run tests in a container with the correct Node version
 *
 * Once you're on Node v16, remove the .skip to enable this test.
 */
describe.skip('TypeOrmAndNodeFsStorageFilesRepository', () => {
//   const directory = 'sqlite';

//   // let dataSource: DataSource;
//   let repository: TypeOrmAndNodeFsStorageFilesRepository;

//   beforeAll(async () => {
//     const on = path.join(__dirname, directory);

//     dataSource = await obtainSqliteDataSource(on);

//     repository = new TypeOrmAndNodeFsStorageFilesRepository(on, dataSource);
//   });

//   afterAll(async () => {
//     await dataSource?.dropDatabase();
//   });

//   afterEach(async () => {
//     await repository.deleteAll();
//   });

//   it('stores and retrieve a file from database and file system', async () => {
//     const file = StorageFileMother.random();
//     const content = 'Hello Wold!!';

//     await repository.store(file, createReadable(content));

//     const retrievedBuffer = await repository.read(file.id);

//     expect(retrievedBuffer.toString()).toBe(content);
//   });

//   it('deletes a stored file', async () => {
//     const file = await createFile(repository);

//     await repository.delete(file.id);

//     const result = await repository.exists(file.id);

//     expect(result).toBe(false);
//   });

//   it('finds a file after being stored', async () => {
//     const stored = await createFile(repository);

//     const exists = await repository.exists(stored.id);

//     expect(exists).toBe(true);
//   });

//   it('retrieves a stored Storage File', async () => {
//     const stored = await createFile(repository);

//     const retrieved = await repository.retrieve(stored.id);

//     expect(stored).toEqual(retrieved);
//   });

//   it('returns all files', async () => {
//     const files = await Promise.all([createFile(repository), createFile(repository), createFile(repository)]);

//     const allFilesRetrieved = await repository.all();

//     expect(files).toEqual(expect.arrayContaining(allFilesRetrieved));
//   });
});
