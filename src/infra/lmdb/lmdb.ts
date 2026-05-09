import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { open } from 'lmdb';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { PATHS } from '@/core/electron/paths';
import { PinState } from '@/node-win/types/placeholder.type';

export type LmdbFile = { path: AbsolutePath; pinState: PinState; onDiskSize: number; size: number; mtime: Date };
export type LmdbFolder = { path: AbsolutePath };

export class Lmdb {
  static db = open<LmdbFile | LmdbFolder>({ path: PATHS.LMDB_DB, encoding: 'json' });

  static get(uuid: FileUuid | FolderUuid) {
    return this.db.get(uuid);
  }

  static getFile(uuid: FileUuid) {
    return this.db.get(uuid) as LmdbFile | undefined;
  }

  static getFolder(uuid: FolderUuid) {
    return this.db.get(uuid) as LmdbFolder | undefined;
  }

  static addFile(uuid: FileUuid, file: LmdbFile) {
    return this.db.put(uuid, file);
  }

  static addFolder(uuid: FolderUuid, folder: LmdbFolder) {
    return this.db.put(uuid, folder);
  }

  static clear() {
    return this.db.clearAsync();
  }
}
