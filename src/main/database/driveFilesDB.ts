import { DatabaseAdapter } from './adapters/base';
import { RemoteSyncedFile } from '../remote-sync/helpers';
import SQLite from 'better-sqlite3';

export function generateCreateTableQuery(): string {
  const query = `CREATE TABLE IF NOT EXISTS drive_files (
    id INTEGER NOT NULL,
    uuid TEXT,
    fileId TEXT UNIQUE NOT NULL,    
    type TEXT NOT NULL,
    size TEXT,
    bucket TEXT,
    folderId INTEGER NOT NULL,
    folderUuid TEXT,
    encryptVersion TEXT,
    userId INTEGER,
    modificationTime TEXT,
    createdAt TEXT,
    updatedAt TEXT NOT NULL,
    plainName TEXT,
    PRIMARY KEY (fileId)
  )`;

  return query;
}

export class DriveFilesDB implements DatabaseAdapter<RemoteSyncedFile> {
  private _db?: SQLite.Database;
  async connect(): Promise<{ success: boolean }> {
    this._db = SQLite('drive_synced.db', {});

    this.db.prepare(generateCreateTableQuery()).run();
    return {
      success: this._db.open,
    };
  }

  async get(fileId: string) {
    const row = this.db
      .prepare('SELECT * FROM drive_files WHERE fileId = ?')
      .get(fileId);

    return {
      success: true,
      result: row as RemoteSyncedFile,
    };
  }

  async update(fileId: string, updatePayload: Partial<RemoteSyncedFile>) {
    const { result } = await this.get(fileId);

    if (!result) return { success: false };

    if (!result) return { success: false };

    return this.create({
      ...result,
      ...updatePayload,
    });
  }

  async create(creationPayload: RemoteSyncedFile) {
    const query = `
                 INSERT INTO drive_files (id, uuid, fileId, type, size, bucket, folderId, folderUuid, encryptVersion, userId, modificationTime, createdAt, updatedAt, plainName)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT (fileId)
                 DO UPDATE SET
                 id = excluded.id,
                 uuid = excluded.uuid,
                 type = excluded.type,
                 size = excluded.size,
                 bucket = excluded.bucket,
                 folderId = excluded.folderId,
                 folderUuid = excluded.folderUuid,
                 encryptVersion = excluded.encryptVersion,
                 userId = excluded.userId,
                 modificationTime = excluded.modificationTime,
                 createdAt = excluded.createdAt,
                 updatedAt = excluded.updatedAt,
                 plainName = excluded.plainName
    `;
    const prepare = this.db.prepare(query);

    prepare.run([
      creationPayload.id,
      creationPayload.uuid,
      creationPayload.fileId,
      creationPayload.type,
      creationPayload.size,
      creationPayload.bucket,
      creationPayload.folderId,
      creationPayload.folderUuid,
      creationPayload.encryptVersion,
      creationPayload.userId,
      creationPayload.modificationTime,
      creationPayload.createdAt,
      creationPayload.updatedAt,
      creationPayload.plainName,
    ]);

    return {
      success: true,
      result: (await this.get(creationPayload.fileId)).result,
    };
  }

  async remove(fileId: string) {
    const { result } = await this.get(fileId);

    if (!result) return { success: false };

    this.db.prepare('DELETE FROM drive_files WHERE fileId = ?').run(fileId);

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
