import { db } from '../../migrations/run-migrations';
import { DriveFile, DriveFolder, RecoverySyncMove, RecoverySyncProcess, RecoverySyncScan } from '../../schema';
import { upsertQuery as upsertFileQuery } from '../file/queries';
import { upsertQuery as upsertFolderQuery } from '../folder/queries';

export const CHECKPOINT = '2026-01-01T00:00:00.000Z';
export const BEFORE_CHECKPOINT = '2025-12-31T00:00:00.000Z';

const scope = { rootUuid: 'rootUuid', userUuid: 'userUuid', workspaceId: '' };
export type Scope = typeof scope;

export function getScope(): Scope {
  return { ...scope };
}

export function clearTables() {
  db.exec('DELETE FROM recovery_sync_move');
  db.exec('DELETE FROM recovery_sync_destination');
  db.exec('DELETE FROM recovery_sync_process');
  db.exec('DELETE FROM recovery_sync_observed');
  db.exec('DELETE FROM recovery_sync_scan');
  db.exec('DELETE FROM drive_file');
  db.exec('DELETE FROM drive_folder');
  db.exec('DELETE FROM checkpoint');
}

export function insertFile(file: Partial<DriveFile> & Pick<DriveFile, 'uuid'>) {
  db.prepare(upsertFileQuery).run({
    id: 1,
    status: 'EXISTS',
    plainName: 'file',
    type: 'txt',
    createdAt: BEFORE_CHECKPOINT,
    updatedAt: BEFORE_CHECKPOINT,
    folderUuid: 'folderUuid',
    workspaceId: scope.workspaceId,
    fileId: 'fileId',
    size: 1024,
    folderId: 1,
    userUuid: scope.userUuid,
    modificationTime: BEFORE_CHECKPOINT,
    creationTime: BEFORE_CHECKPOINT,
    ...file,
  });
}

export function insertFolder(folder: Partial<DriveFolder> & Pick<DriveFolder, 'uuid'>) {
  db.prepare(upsertFolderQuery).run({
    id: 1,
    status: 'EXISTS',
    plainName: 'folder',
    createdAt: BEFORE_CHECKPOINT,
    updatedAt: BEFORE_CHECKPOINT,
    parentUuid: 'parentUuid',
    workspaceId: scope.workspaceId,
    parentId: 1,
    userUuid: scope.userUuid,
    creationTime: BEFORE_CHECKPOINT,
    modificationTime: BEFORE_CHECKPOINT,
    ...folder,
  });
}

export function insertScan(scan: Partial<RecoverySyncScan> & Pick<RecoverySyncScan, 'itemType'>) {
  db.prepare(
    `INSERT INTO recovery_sync_scan (rootUuid, itemType, checkpoint, updatedAt, completed)
     VALUES (:rootUuid, :itemType, :checkpoint, :updatedAt, :completed)`,
  ).run({ rootUuid: scope.rootUuid, checkpoint: CHECKPOINT, updatedAt: '1970-01-01T00:00:00.000Z', completed: 0, ...scan });
}

export function insertObserved(observed: { itemType: 'file' | 'folder'; uuid: string; remoteStatus: string; rootUuid?: string }) {
  db.prepare(
    `INSERT INTO recovery_sync_observed (rootUuid, itemType, uuid, remoteStatus)
     VALUES (:rootUuid, :itemType, :uuid, :remoteStatus)`,
  ).run({ rootUuid: scope.rootUuid, ...observed });
}

export function getScans() {
  return db.prepare('SELECT * FROM recovery_sync_scan ORDER BY rootUuid, itemType').all();
}

export function getObserved() {
  return db.prepare('SELECT * FROM recovery_sync_observed ORDER BY rootUuid, itemType, uuid').all();
}

export function insertProcess(process: Partial<RecoverySyncProcess> & Pick<RecoverySyncProcess, 'startedAt'>) {
  db.prepare('INSERT INTO recovery_sync_process (rootUuid, startedAt) VALUES (:rootUuid, :startedAt)').run({
    rootUuid: scope.rootUuid,
    ...process,
  });
}

export function getProcesses() {
  return db.prepare('SELECT * FROM recovery_sync_process ORDER BY rootUuid').all();
}

export function getDestinations() {
  return db.prepare('SELECT * FROM recovery_sync_destination ORDER BY rootUuid, volume').all();
}

export function getMove(): Omit<RecoverySyncMove, 'stage'> {
  return {
    rootUuid: scope.rootUuid,
    itemType: 'file',
    uuid: 'uuid1',
    source: String.raw`C:\Users\user\InternxtDrive\file.txt`,
    destination: String.raw`C:\Internxt Recovery Sync 2026-01-01 100000\file.txt`,
    removalStatus: 'DELETED',
    sourceSize: 1024,
    sourceModifiedAt: BEFORE_CHECKPOINT,
  };
}

export function insertMove(move: Partial<RecoverySyncMove> & Pick<RecoverySyncMove, 'uuid'>) {
  const { rootUuid, itemType, uuid } = { ...getMove(), ...move };
  db.prepare(
    `INSERT INTO recovery_sync_move (rootUuid, itemType, uuid, source, destination, removalStatus, sourceSize, sourceModifiedAt, stage)
     VALUES (:rootUuid, :itemType, :uuid, :source, :destination, :removalStatus, :sourceSize, :sourceModifiedAt, :stage)`,
  ).run({ ...getMove(), destination: `${rootUuid}/${itemType}/${uuid}`, stage: 'reserved', ...move });
}

export function getMoves() {
  return db.prepare('SELECT * FROM recovery_sync_move ORDER BY rootUuid, itemType, uuid').all();
}
