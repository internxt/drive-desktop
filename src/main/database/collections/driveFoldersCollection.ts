import { DatabaseCollectionAdapter } from '../adapters/base';
import { RemoteSyncedFolder } from '../../remote-sync/helpers';
import SQLite from 'better-sqlite3';

export function generateCreateTableQuery(): string {
  const query = `CREATE TABLE IF NOT EXISTS drive_folders (
    type TEXT NOT NULL,
    id INTEGER UNIQUE NOT NULL,
    parentId INTEGER,
    bucket TEXT,
    userId INTEGER, 
    createdAt TEXT,
    updatedAt TEXT NOT NULL,
    uuid TEXT NOT NULL,
    plainName TEXT,
    status TEXT NOT NULL,
    PRIMARY KEY (uuid)
  )`;

  return query;
}

export class DriveFoldersCollection
  implements DatabaseCollectionAdapter<RemoteSyncedFolder>
{
  private _db?: SQLite.Database;
  async connect(): Promise<{ success: boolean }> {
    this._db = SQLite('drive_synced.db', {});

    this.db.prepare(generateCreateTableQuery()).run();
    return {
      success: this._db.open,
    };
  }

  async get(uuid: RemoteSyncedFolder['uuid']) {
    const row = this.db
      .prepare('SELECT * FROM drive_folders WHERE uuid = ?')
      .get(uuid);

    return {
      success: true,
      result: row as RemoteSyncedFolder,
    };
  }

  async update(
    uuid: RemoteSyncedFolder['uuid'],
    updatePayload: Partial<RemoteSyncedFolder>
  ) {
    const { result } = await this.get(uuid);

    if (!result) return { success: false };

    return this.create({
      ...result,
      ...updatePayload,
    });
  }

  async create(creationPayload: RemoteSyncedFolder) {
    const query = `
                 INSERT INTO drive_folders (type, id, parentId, bucket, userId, createdAt, updatedAt, uuid, plainName, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT (uuid)
                 DO UPDATE SET
                 type = excluded.type,
                 id = excluded.id,
                 parentId = excluded.parentId,
                 bucket = excluded.bucket,
                 userId = excluded.userId,
                 createdAt = excluded.createdAt,
                 updatedAt = excluded.updatedAt,
                 plainName = excluded.plainName,
                 status = excluded.status
    `;
    const prepare = this.db.prepare(query);

    prepare.run([
      creationPayload.type,
      creationPayload.id,
      creationPayload.parentId,
      creationPayload.bucket,
      creationPayload.userId,
      creationPayload.createdAt,
      creationPayload.updatedAt,
      creationPayload.uuid,
      creationPayload.plainName,
      creationPayload.status,
    ]);

    return {
      success: true,
      result: (await this.get(creationPayload.uuid)).result,
    };
  }

  async remove(uuid: RemoteSyncedFolder['uuid']) {
    const { result } = await this.get(uuid);

    if (!result) return { success: false };
    this.db.prepare('DELETE FROM drive_folders WHERE uuid = ?').run(uuid);
    return {
      success: true,
    };
  }

  private get db() {
    if (!this._db) {
      throw new Error('Db not ready, call connect() successfully first');
    }

    return this._db;
  }
}
