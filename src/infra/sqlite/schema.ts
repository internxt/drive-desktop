/**
 * 2.6.8 Daniel Jiménez
 * Previously this project was using `typeorm` to manage the sqlite database, but we had some issues:
 *
 * 1. We were running `typeorm` option with `synchronize: true`, which runs migrations automatically. However
 * not all migrations were run automatically. If we remove the `UNIQUE` property of a field (like we did
 * with `fileId`) it's not removed automatically from the database. `synchronize: true` just runs some
 * migrations like adding a column. This is an issue since we needed to know the internals of `typeorm`
 * which is not usual knowledge.
 * 2. Removing the `syncrhonize: true` option and using `typeorm` migrations was not the best. The migrations
 * were inside a typescript file being just a single line string, so it wasn't easy to spot issues or apply more customize
 * migrations.
 *
 * Basically `typeorm` is high level orm that was removing "complexity" but we didn't have control about what was
 * happening. So we decided to try different alternatives. First, the requirements. We needed something that was able to
 * run migrations from code (since it's a desktop app and we cannot run them from cli) and also thas was able to run
 * different sqlite drivers. For example, `drizzleOrm` only allows `better_sqlite3`, which is the fastest sqlite driver,
 * but it's native so we needed to rebuild it everytime we wanted to run the app or running tests, which was throwing
 * the development experience away.
 *
 * We found that no ORM was meeting our requirements so we decided to move to raw sql using `node:sqlite`. Why?
 *
 * 1. The database is very small and we don't have any relationship.
 * 2. We want high control of what's happening behind since everything is going to run on the client side and any small
 * mistake is difficult to recover (like it has happened before). We would have our migrations in sql files and
 * create our own migrations table.
 * 3. `node:sqlite` is nearly as fast as `better_sqlite3` but doesn't need to be compiled against Electron.
 *
 * The downsides are that `node:sqlite` is still experimental (but enough stable for our use cases) and that we lose
 * type inference (we are going to rely on tests so we don't break anything). Also, to have a better view of our current
 * sqlite state and compare against the type definitions in this file, we have added the command:
 * `npm run schema`
 * which generates the `schema.sql` file close to this one so we can compare that everything is right. Everytime we add
 * a migration we will update the `schema.sql` to see the real state of the database and not miss anything.
 */

export type DriveFile = {
  id: number;
  uuid: string;
  status: 'EXISTS' | 'TRASHED' | 'DELETED';
  plainName: string | null;
  type: string | null;
  createdAt: string;
  updatedAt: string;
  folderUuid: string | null;
  workspaceId: string | null;
  fileId: string;
  size: number;
  folderId: number;
  userUuid: string;
  modificationTime: string;
};
