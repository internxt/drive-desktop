import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DriveFile } from '@/infra/sqlite/schema';
import * as recovery from '../../index';
import { PreservationAdapters } from './preserve-item';

describe('preserve-item', () => {
  let database: DatabaseSync;
  let adapters: PreservationAdapters;
  let props: Parameters<typeof recovery.preserveItem>[0];
  let events: string[];
  const date = '2026-09-01T00:00:00.000Z';
  const ctx = { rootUuid: 'root', userUuid: 'user', workspaceId: '' };

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec('PRAGMA foreign_keys = ON');
    readdirSync('migrations')
      .filter((file) => file.endsWith('.sql'))
      .sort()
      .forEach((file) => {
        database.exec(readFileSync(join('migrations', file), 'utf8'));
      });
    const file: DriveFile = {
      id: 1,
      uuid: 'file',
      status: 'EXISTS',
      plainName: 'file',
      type: 'txt',
      createdAt: date,
      updatedAt: date,
      folderUuid: 'parent',
      workspaceId: '',
      fileId: 'contents',
      size: 10,
      folderId: 1,
      userUuid: ctx.userUuid,
      creationTime: date,
      modificationTime: date,
    };
    const values = Object.keys(file)
      .map(() => '?')
      .join(',');
    database.prepare(`INSERT INTO drive_file (${Object.keys(file).join(',')}) VALUES (${values})`).run(...Object.values(file));
    database
      .prepare('INSERT INTO checkpoint (type, name, updatedAt, userUuid, workspaceId) VALUES (?, ?, ?, ?, ?)')
      .run('file', 'files', '2026-10-01T00:00:00.000Z', ctx.userUuid, ctx.workspaceId);

    expect(
      recovery.accessDatabase({ database, action: recovery.createOrResumeProcess, input: { ctx, startedAt: date }, transaction: true })
        .error,
    ).toBeUndefined();
    const scanId = recovery.getActiveScan({ database, rootUuid: ctx.rootUuid, itemType: 'file' }).data!.scanId;
    expect(
      recovery.accessDatabase({ database, action: recovery.prepareCandidates, input: { scanId }, transaction: true }).error,
    ).toBeUndefined();
    expect(recovery.advanceProcess({ database, rootUuid: ctx.rootUuid, stage: 'scanning' }).error).toBeUndefined();
    expect(
      recovery.accessDatabase({
        database,
        action: recovery.commitScanPage,
        input: { scanId, observations: [], updatedAt: date, complete: true },
        transaction: true,
      }).error,
    ).toBeUndefined();
    expect(recovery.advanceProcess({ database, rootUuid: ctx.rootUuid, stage: 'preserving' }).error).toBeUndefined();
    expect(
      recovery.accessDatabase({
        database,
        action: recovery.reserveDestination,
        input: { rootUuid: ctx.rootUuid, volume: 'C:\\', path: String.raw`C:\Recovery` },
        transaction: true,
      }).error,
    ).toBeUndefined();
    expect(recovery.markDestinationCreated({ database, rootUuid: ctx.rootUuid, volume: 'C:\\' }).error).toBeUndefined();
    events = [];
    adapters = {
      preserveContents: ({ move }) => {
        events.push('move contents');
        expect(move.destination).toBe(String.raw`C:\Recovery\file`);
        expect(database.prepare('SELECT stage FROM recovery_move').get()?.stage).toBe('pending');
        expect(database.prepare('SELECT status FROM drive_file').get()?.status).toBe('EXISTS');
        return Promise.resolve(Result.ok({ preservedFileCount: 1 }));
      },
      withMoveGuard: async ({ action }) => {
        events.push('acquire guard');
        const result = await action();
        expect(database.prepare('SELECT watcherSettled FROM recovery_move').get()?.watcherSettled).toBe(0);
        events.push('settle watcher events');
        return result;
      },
    };

    props = {
      database,
      scanId,
      uuid: file.uuid,
      volume: 'C:\\',
      source: String.raw`C:\Drive\file`,
      destination: String.raw`C:\Recovery\file`,
      removalStatus: 'DELETED',
      adapters,
    };
  });

  afterEach(() => database.close());

  it('owns the move, database update and guard release in order, and retries without repeating work', async () => {
    // When
    const result = await recovery.preserveItem(props);
    // Then
    expect(result.data).toEqual({ applied: true });
    expect(events).toEqual(['acquire guard', 'move contents', 'settle watcher events']);
    expect(database.prepare('SELECT status FROM drive_file').get()?.status).toBe('DELETED');
    expect(recovery.listMoves({ database, scanId: props.scanId, stage: 'completed' }).data?.[0].watcherSettled).toBe(1);
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.preservedFileCount).toBe(1);
    events = [];
    expect((await recovery.preserveItem(props)).data).toEqual({ applied: true });
    expect(events).toEqual([]);
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.preservedFileCount).toBe(1);
  });

  it('leaves the source status and durable guard unchanged if contents cannot be preserved', async () => {
    // Given
    const error = new Error('permission denied');
    adapters.preserveContents = () => Promise.resolve(Result.err(error));
    // When
    const result = await recovery.preserveItem(props);
    // Then
    expect(result.error).toBe(error);
    expect(database.prepare('SELECT status FROM drive_file').get()?.status).toBe('EXISTS');
    expect(recovery.listMoves({ database, scanId: props.scanId, stage: 'pending' }).data?.[0].watcherSettled).toBe(0);
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.preservedFileCount).toBe(0);
  });

  it('converts thrown filesystem failures into errors without releasing the guard', async () => {
    // Given
    const error = new Error('filesystem failed');
    adapters.preserveContents = () => Promise.reject(error);
    // When
    const result = await recovery.preserveItem(props);
    // Then
    expect(result.error).toBe(error);
    expect(events).toEqual(['acquire guard', 'settle watcher events']);
    expect(database.prepare('SELECT status FROM drive_file').get()?.status).toBe('EXISTS');
    expect(recovery.listMoves({ database, scanId: props.scanId, stage: 'pending' }).data?.[0].watcherSettled).toBe(0);
  });

  it('retries watcher settlement after a completed move without moving or counting contents again', async () => {
    // Given
    const guarded = adapters.withMoveGuard;
    const error = new Error('watcher has unfinished events');
    adapters.withMoveGuard = async ({ action }) => {
      const result = await action();
      return Result.isError(result) ? result : Result.err(error);
    };
    // When
    const result = await recovery.preserveItem(props);
    // Then
    expect(result.error).toBe(error);
    expect(database.prepare('SELECT status FROM drive_file').get()?.status).toBe('DELETED');
    expect(recovery.listMoves({ database, scanId: props.scanId, stage: 'completed' }).data?.[0].watcherSettled).toBe(0);
    expect(recovery.advanceProcess({ database, rootUuid: ctx.rootUuid, stage: 'reporting' }).error).toBeInstanceOf(Error);
    adapters.withMoveGuard = guarded;
    events = [];
    expect((await recovery.preserveItem(props)).data).toEqual({ applied: true });
    expect(events).toEqual(['acquire guard', 'settle watcher events']);
    expect(recovery.listMoves({ database, scanId: props.scanId, stage: 'completed' }).data?.[0].watcherSettled).toBe(1);
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.preservedFileCount).toBe(1);
  });

  it('resumes the database update after a persistence failure without moving contents twice', async () => {
    // Given
    database.exec(`CREATE TRIGGER fail_status BEFORE UPDATE OF status ON drive_file
      BEGIN SELECT RAISE(ABORT, 'injected failure'); END`);
    // When
    expect((await recovery.preserveItem(props)).error).toBeInstanceOf(Error);
    // Then
    expect(recovery.listMoves({ database, scanId: props.scanId, stage: 'moved' }).data?.[0].watcherSettled).toBe(0);
    expect(database.prepare('SELECT status FROM drive_file').get()?.status).toBe('EXISTS');
    database.exec('DROP TRIGGER fail_status');
    events = [];
    expect((await recovery.preserveItem(props)).data).toEqual({ applied: true });
    expect(events).toEqual(['acquire guard', 'settle watcher events']);
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.preservedFileCount).toBe(1);
  });

  it('preserves a concurrent local version and releases its guard after settlement', async () => {
    // Given
    adapters.preserveContents = () => {
      database.prepare('UPDATE drive_file SET modificationTime = ?').run('2026-10-02T00:00:00.000Z');
      return Promise.resolve(Result.ok({ preservedFileCount: 1 }));
    };
    // When
    const result = await recovery.preserveItem(props);
    // Then
    expect(result.data).toEqual({ applied: false });
    expect(database.prepare('SELECT status FROM drive_file').get()?.status).toBe('EXISTS');
    expect(recovery.listMoves({ database, scanId: props.scanId, stage: 'conflict' }).data?.[0].watcherSettled).toBe(1);
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.preservedFileCount).toBe(1);
  });

  it('does not invoke filesystem or watcher adapters when reservation detects newer local state', async () => {
    // Given
    database.prepare('UPDATE drive_file SET plainName = ?').run('local edit');
    // When
    const result = await recovery.preserveItem(props);
    // Then
    expect(result.error).toBeInstanceOf(Error);
    expect(events).toEqual([]);
    expect(recovery.listMoves({ database, scanId: props.scanId, stage: 'pending' }).data).toEqual([]);
  });

  it('reuses its recorded destination when contents moved but the count transaction failed', async () => {
    // Given
    let actualMoves = 0;
    let destinationExists = false;
    adapters.preserveContents = ({ move }) => {
      expect(move.destination).toBe(props.destination);
      if (!destinationExists) {
        actualMoves++;
        destinationExists = true;
      }
      return Promise.resolve(Result.ok({ preservedFileCount: 1 }));
    };

    database.exec(`CREATE TRIGGER fail_count BEFORE UPDATE OF preservedFileCount ON recovery_process
      BEGIN SELECT RAISE(ABORT, 'injected failure'); END`);
    // When
    expect((await recovery.preserveItem(props)).error).toBeInstanceOf(Error);
    // Then
    expect(recovery.listMoves({ database, scanId: props.scanId, stage: 'pending' }).data).toHaveLength(1);
    expect(database.prepare('SELECT status FROM drive_file').get()?.status).toBe('EXISTS');
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.preservedFileCount).toBe(0);
    database.exec('DROP TRIGGER fail_count');
    expect((await recovery.preserveItem(props)).data).toEqual({ applied: true });
    expect(actualMoves).toBe(1);
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.preservedFileCount).toBe(1);
  });
});
