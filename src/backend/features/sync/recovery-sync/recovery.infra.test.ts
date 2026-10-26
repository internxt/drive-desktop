import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DriveFile } from '@/infra/sqlite/schema';
import { advanceProcess, completeProcess, createOrResumeProcess } from './index';
import * as recovery from './index';
import { releaseMoveGuard } from './repository/release-move-guard';
import { candidateBatchQuery } from './repository/snapshot/candidateBatchQuery';
import { completeMove } from './services/preservation/complete-move';
import { markMovePreserved } from './services/preservation/mark-move-preserved';
import { reserveMove } from './services/preservation/reserve-move';
import { RecoveryContext, RecoveryScan } from './types';

describe('recovery', () => {
  let database: DatabaseSync;
  let directory: string;
  const checkpoint = '2026-10-01T00:00:00.000Z';
  const oldDate = '2026-09-01T00:00:00.000Z';
  const ctx: RecoveryContext = { rootUuid: 'personal-root', userUuid: 'user', workspaceId: '' };

  function execute<T, const Input extends object>(props: {
    action: (props: Input & { database: DatabaseSync }) => Result<T>;
    input: Input;
    transaction?: boolean;
  }): Result<T> {
    return recovery.accessDatabase({ database, ...props });
  }

  function addCheckpoint({ context = ctx, itemType }: { context?: RecoveryContext; itemType: 'file' | 'folder' }) {
    database
      .prepare('INSERT INTO checkpoint (type, name, updatedAt, userUuid, workspaceId) VALUES (?, ?, ?, ?, ?)')
      .run(itemType, 'test', checkpoint, context.userUuid, context.workspaceId);
  }

  function insertItem({
    uuid,
    context = ctx,
    itemType = 'file',
    updatedAt = oldDate,
    status = 'EXISTS',
  }: {
    uuid: string;
    context?: RecoveryContext;
    itemType?: 'file' | 'folder';
    updatedAt?: string;
    status?: DriveFile['status'];
  }) {
    const common = {
      id: 1,
      uuid,
      userUuid: context.userUuid,
      workspaceId: context.workspaceId,
      updatedAt,
      status,
      plainName: uuid,
      createdAt: oldDate,
      creationTime: oldDate,
      modificationTime: oldDate,
    };
    const item =
      itemType === 'file'
        ? { ...common, type: 'txt', folderUuid: 'parent', folderId: 1, size: 10, fileId: 'contents' }
        : { ...common, parentUuid: 'parent', parentId: null };
    const table = itemType === 'file' ? 'drive_file' : 'drive_folder';
    const placeholders = Object.keys(item)
      .map(() => '?')
      .join(',');
    database.prepare(`INSERT INTO ${table} (${Object.keys(item).join(',')}) VALUES (${placeholders})`).run(...Object.values(item));
    return item;
  }

  function start({ context = ctx, startedAt = checkpoint }: { context?: RecoveryContext; startedAt?: string } = {}) {
    const result = execute({ action: createOrResumeProcess, input: { ctx: context, startedAt }, transaction: true });
    expect(result.error).toBeUndefined();
    const scans = recovery.listScans({ database, rootUuid: context.rootUuid });
    expect(scans.error).toBeUndefined();
    return scans.data!;
  }

  function prepare(scanId: number, limit = 1000) {
    let complete = false;
    while (!complete) {
      const result = execute({ action: recovery.prepareCandidates, input: { scanId, limit }, transaction: true });
      expect(result.error).toBeUndefined();
      complete = result.data!.complete;
    }
  }

  function advance({ stage, rootUuid = ctx.rootUuid }: { stage: 'scanning' | 'preserving' | 'reporting'; rootUuid?: string }) {
    return execute({ action: advanceProcess, input: { rootUuid, stage } });
  }

  function beginScanning(scans: RecoveryScan[]) {
    scans.forEach((scan) => prepare(scan.scanId));
    expect(advance({ stage: 'scanning', rootUuid: scans[0].rootUuid }).error).toBeUndefined();
  }

  function beginPreserving(scans: RecoveryScan[]) {
    for (const scan of scans) {
      const current = recovery.getActiveScan({ database, rootUuid: scan.rootUuid, itemType: scan.itemType }).data!;
      if (current.stage !== 'completed') {
        expect(
          execute({
            action: recovery.commitScanPage,
            input: { scanId: scan.scanId, observations: [], updatedAt: oldDate, complete: true },
            transaction: true,
          }).error,
        ).toBeUndefined();
      }
    }
    const rootUuid = scans[0].rootUuid;
    expect(advance({ stage: 'preserving', rootUuid }).error).toBeUndefined();
    expect(
      recovery.accessDatabase({
        database,
        action: recovery.reserveDestination,
        input: { rootUuid, volume: 'C:\\', path: String.raw`C:\Recovery` },
        transaction: true,
      }).error,
    ).toBeUndefined();
    expect(recovery.markDestinationCreated({ database, rootUuid, volume: 'C:\\' }).error).toBeUndefined();
  }

  function reserve({ scanId, uuid = 'a' }: { scanId: number; uuid?: string }) {
    return recovery.accessDatabase({
      database,
      action: reserveMove,
      input: { scanId, uuid, volume: 'C:\\', source: `C:\\Drive\\${uuid}`, destination: `C:\\Recovery\\${uuid}`, removalStatus: 'DELETED' },
      transaction: true,
    });
  }

  function complete(rootUuid = ctx.rootUuid) {
    return execute({ action: completeProcess, input: { rootUuid }, transaction: true });
  }

  function reopen() {
    database.close();
    database = new DatabaseSync(join(directory, 'recovery.db'));
    database.exec('PRAGMA foreign_keys = ON');
  }

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'drive-recovery-'));
    database = new DatabaseSync(join(directory, 'recovery.db'));
    database.exec('PRAGMA foreign_keys = ON');
    readdirSync('migrations')
      .filter((file) => file.endsWith('.sql'))
      .sort()
      .forEach((file) => {
        database.exec(readFileSync(join('migrations', file), 'utf8'));
      });
    addCheckpoint({ itemType: 'file' });
  });

  afterEach(() => {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it('isolates users, workspaces and item types, and skips inventories without a checkpoint', () => {
    // Given
    const contexts = [
      ctx,
      { ...ctx, rootUuid: 'workspace-root', workspaceId: 'workspace' },
      { ...ctx, rootUuid: 'other-user-root', userUuid: 'other' },
    ];
    addCheckpoint({ itemType: 'folder' });
    contexts.slice(1).forEach((context) => addCheckpoint({ context, itemType: 'file' }));
    contexts.forEach((context, index) => insertItem({ uuid: `${index}`, context }));
    insertItem({ uuid: 'folder', itemType: 'folder' });
    // When
    const scans = contexts.flatMap((context) => start({ context }));
    scans.forEach((scan) => prepare(scan.scanId));
    // Then
    expect(scans).toHaveLength(4);
    for (const scan of scans) {
      const index = contexts.findIndex((context) => context.rootUuid === scan.rootUuid);
      const expected = scan.itemType === 'folder' ? 'folder' : `${index}`;
      expect(execute({ action: recovery.listCandidates, input: { scanId: scan.scanId } }).data?.map((item) => item.uuid)).toEqual([
        expected,
      ]);
      expect(recovery.getActiveScan({ database, rootUuid: scan.rootUuid, itemType: scan.itemType }).data?.scanId).toBe(scan.scanId);
    }
    expect(start({ context: { ...ctx, rootUuid: 'initial-root', userUuid: 'initial' } })).toEqual([]);
  });

  it('keeps personal and workspace roots, checkpoints and inventories separate for the same user', () => {
    // Given
    const workspace = { ...ctx, rootUuid: 'membership-root', workspaceId: 'workspace-id' };
    const workspaceCheckpoint = '2026-10-05T00:00:00.000Z';
    const contexts = [ctx, workspace];
    for (const context of contexts) {
      for (const itemType of ['file', 'folder'] as const) {
        if (context.workspaceId || itemType === 'folder') addCheckpoint({ context, itemType });
        insertItem({ uuid: `${context.rootUuid}-${itemType}`, context, itemType });
      }
    }
    database.prepare('UPDATE checkpoint SET updatedAt = ? WHERE workspaceId = ?').run(workspaceCheckpoint, workspace.workspaceId);
    // When
    for (const context of contexts) {
      const scans = start({ context });
      expect(scans).toHaveLength(2);
      for (const scan of scans) {
        expect(scan).toMatchObject({
          rootUuid: context.rootUuid,
          userUuid: context.userUuid,
          workspaceId: context.workspaceId,
          checkpoint: context.workspaceId ? workspaceCheckpoint : checkpoint,
        });
        prepare(scan.scanId, 1);
        expect(execute({ action: recovery.listCandidates, input: { scanId: scan.scanId } }).data?.map((item) => item.uuid)).toEqual([
          `${context.rootUuid}-${scan.itemType}`,
        ]);
      }
    }
    reopen();
    const resumed = start({ context: workspace, startedAt: workspaceCheckpoint });
    // Then
    expect(resumed).toHaveLength(2);
    expect(recovery.getProcess({ database, rootUuid: workspace.rootUuid }).data?.startedAt).toBe(checkpoint);
    expect(recovery.getProcess({ database, rootUuid: workspace.workspaceId }).data).toBeUndefined();
    expect(recovery.getActiveScan({ database, rootUuid: workspace.workspaceId, itemType: 'file' }).data).toBeUndefined();
    const workspaceScan = resumed.find((scan) => scan.itemType === 'file')!;
    expect(advance({ rootUuid: workspace.rootUuid, stage: 'scanning' }).error).toBeUndefined();
    expect(
      execute({
        action: recovery.commitScanPage,
        input: { scanId: workspaceScan.scanId, observations: [{ uuid: `${workspace.rootUuid}-file` }], updatedAt: oldDate },
        transaction: true,
      }).error,
    ).toBeUndefined();
    const personal = recovery.getActiveScan({ database, rootUuid: ctx.rootUuid, itemType: 'file' }).data!;
    expect(personal.updatedAt).toBe('1970-01-01T00:00:00.000Z');
    expect(execute({ action: recovery.listCandidates, input: { scanId: personal.scanId } }).data?.[0].observed).toBe(0);
    expect(recovery.listUnfinishedProcesses({ database }).data).toHaveLength(2);
  });

  it('enforces one active recovery per root across database connections', () => {
    // Given
    start();
    const other = new DatabaseSync(join(directory, 'recovery.db'));
    try {
      // When
      const duplicate = recovery.accessDatabase({
        database: other,
        action: recovery.ProcessRepository.insertProcess,
        input: { rootUuid: ctx.rootUuid, startedAt: oldDate },
        transaction: true,
      });
      // Then
      expect(duplicate.error).toBeInstanceOf(Error);
      expect(recovery.listUnfinishedProcesses({ database }).data).toHaveLength(1);
      expect(
        recovery.accessDatabase({
          database: other,
          action: createOrResumeProcess,
          input: { ctx: { ...ctx, rootUuid: 'other-root' }, startedAt: checkpoint },
          transaction: true,
        }).error,
      ).toBeUndefined();
      expect(recovery.listUnfinishedProcesses({ database }).data).toHaveLength(2);
    } finally {
      other.close();
    }
  });

  it('rolls back process and file registration if folder registration fails', () => {
    // Given
    addCheckpoint({ itemType: 'folder' });
    database.exec(`CREATE TRIGGER fail_folder BEFORE INSERT ON recovery_scan WHEN NEW.itemType = 'folder'
      BEGIN SELECT RAISE(ABORT, 'injected failure'); END`);
    // When
    const result = execute({ action: createOrResumeProcess, input: { ctx, startedAt: checkpoint }, transaction: true });
    // Then
    expect(result.error).toBeInstanceOf(Error);
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data).toBeUndefined();
    expect(recovery.listScans({ database, rootUuid: ctx.rootUuid }).data).toEqual([]);
    expect(
      database
        .prepare('SELECT updatedAt FROM checkpoint')
        .all()
        .every((row) => row.updatedAt === checkpoint),
    ).toBe(true);
  });

  it('captures eligible original versions once, and resumes interrupted preparation without replacing them', () => {
    // Given
    ['a', 'b', 'c'].forEach((uuid) => insertItem({ uuid }));
    insertItem({ uuid: 'd', updatedAt: checkpoint });
    insertItem({ uuid: 'e', updatedAt: '2026-10-02T00:00:00.000Z' });
    insertItem({ uuid: 'f', status: 'TRASHED' });
    const [scan] = start();
    // When
    expect(execute({ action: recovery.prepareCandidates, input: { scanId: scan.scanId, limit: 1 }, transaction: true }).data).toEqual({
      prepared: 1,
      complete: false,
    });
    database.exec("UPDATE drive_file SET plainName = 'new name' WHERE uuid = 'a'");
    database.exec("UPDATE checkpoint SET updatedAt = '2026-11-01T00:00:00.000Z'");
    reopen();
    expect(start({ startedAt: '2026-10-02T00:00:00.000Z' }).map((item) => item.scanId)).toEqual([scan.scanId]);
    prepare(scan.scanId, 1);
    // Then
    const candidates = execute({ action: recovery.listCandidates, input: { scanId: scan.scanId } }).data!;
    expect(candidates.map((item) => item.uuid)).toEqual(['a', 'b', 'c']);
    expect(candidates[0].original.plainName).toBe('a');
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.startedAt).toBe(checkpoint);
    expect(recovery.getActiveScan({ database, rootUuid: ctx.rootUuid, itemType: 'file' }).data?.checkpoint).toBe(checkpoint);
    expect(execute({ action: recovery.prepareCandidates, input: { scanId: scan.scanId }, transaction: true }).data).toEqual({
      prepared: 0,
      complete: true,
    });
    expect(advance({ stage: 'scanning' }).error).toBeUndefined();
  });

  it('rolls back an interrupted preparation batch and refuses scanning before every branch is prepared', () => {
    // Given
    ['a', 'b'].forEach((uuid) => insertItem({ uuid }));
    addCheckpoint({ itemType: 'folder' });
    const scans = start();
    database.exec(`CREATE TRIGGER fail_candidate BEFORE INSERT ON recovery_candidate WHEN NEW.uuid = 'b'
      BEGIN SELECT RAISE(ABORT, 'injected failure'); END`);

    // When
    expect(execute({ action: recovery.prepareCandidates, input: { scanId: scans[0].scanId }, transaction: true }).error).toBeInstanceOf(
      Error,
    );
    // Then
    expect(execute({ action: recovery.listCandidates, input: { scanId: scans[0].scanId } }).data).toEqual([]);
    expect(recovery.getActiveScan({ database, rootUuid: ctx.rootUuid, itemType: 'file' }).data?.preparationAfter).toBe('');
    expect(advance({ stage: 'scanning' }).error).toBeInstanceOf(Error);
    database.exec('DROP TRIGGER fail_candidate');
    prepare(scans[0].scanId);
    expect(advance({ stage: 'scanning' }).error).toBeInstanceOf(Error);
    prepare(scans[1].scanId);
    expect(advance({ stage: 'scanning' }).error).toBeUndefined();
  });

  it('persists observations with progress, replays timestamps, and stages removals without changing live status', () => {
    // Given
    ['a', 'b'].forEach((uuid) => insertItem({ uuid }));
    const scans = start();
    beginScanning(scans);
    const page = {
      scanId: scans[0].scanId,
      observations: [{ uuid: 'a', removal: { status: 'TRASHED' as const, updatedAt: oldDate } }],
      updatedAt: oldDate,
    };
    // When
    expect(execute({ action: recovery.commitScanPage, input: { ...page }, transaction: true }).error).toBeUndefined();
    reopen();
    expect(execute({ action: recovery.commitScanPage, input: { ...page }, transaction: true }).error).toBeUndefined();
    // Then
    expect(recovery.getActiveScan({ database, rootUuid: ctx.rootUuid, itemType: 'file' }).data?.updatedAt).toBe(oldDate);
    expect(
      execute({ action: recovery.listCandidates, input: { scanId: scans[0].scanId, selection: 'unobserved' } }).data?.map(
        (item) => item.uuid,
      ),
    ).toEqual(['b']);

    expect(
      execute({ action: recovery.listCandidates, input: { scanId: scans[0].scanId, selection: 'removed' } }).data?.[0].removedStatus,
    ).toBe('TRASHED');
    expect(database.prepare("SELECT status FROM drive_file WHERE uuid = 'a'").get()?.status).toBe('EXISTS');
    expect(database.prepare('SELECT updatedAt FROM checkpoint').get()?.updatedAt).toBe(checkpoint);
    expect(advance({ stage: 'preserving' }).error).toBeInstanceOf(Error);
  });

  it('rolls back observations if progress persistence fails and rejects regressing progress', () => {
    // Given
    insertItem({ uuid: 'a' });
    const scans = start();
    beginScanning(scans);
    database.exec(`CREATE TRIGGER fail_progress BEFORE UPDATE OF updatedAt ON recovery_scan
      BEGIN SELECT RAISE(ABORT, 'injected failure'); END`);
    const page = { scanId: scans[0].scanId, observations: [{ uuid: 'a' }], updatedAt: oldDate };
    // When
    expect(execute({ action: recovery.commitScanPage, input: { ...page }, transaction: true }).error).toBeInstanceOf(Error);
    // Then
    expect(execute({ action: recovery.listCandidates, input: { scanId: scans[0].scanId } }).data?.[0].observed).toBe(0);
    expect(recovery.getActiveScan({ database, rootUuid: ctx.rootUuid, itemType: 'file' }).data?.updatedAt).toBe('1970-01-01T00:00:00.000Z');
    database.exec('DROP TRIGGER fail_progress');
    expect(execute({ action: recovery.commitScanPage, input: { ...page }, transaction: true }).error).toBeUndefined();
    expect(
      execute({ action: recovery.commitScanPage, input: { ...page, updatedAt: '1970-01-01T00:00:00.000Z' }, transaction: true }).error,
    ).toBeInstanceOf(Error);
  });

  it.each(['file', 'folder'] as const)('protects original %s state, including status-only mutations, during repairs', (itemType) => {
    // Given
    if (itemType === 'folder') addCheckpoint({ itemType });
    const item = insertItem({ uuid: 'a', itemType });
    const scans = start();
    beginScanning(scans);
    const scan = scans.find((value) => value.itemType === itemType)!;
    const table = itemType === 'file' ? 'drive_file' : 'drive_folder';
    const repair = () =>
      execute({
        action: recovery.repairCandidate,
        input: { scanId: scan.scanId, uuid: 'a', item: { ...item, plainName: 'remote' } },
        transaction: true,
      });
    // When
    database.prepare(`UPDATE ${table} SET status = 'TRASHED' WHERE uuid = 'a'`).run();
    // Then
    expect(repair().error).toBeInstanceOf(Error);
    expect(database.prepare(`SELECT status FROM ${table}`).get()?.status).toBe('TRASHED');
    database.prepare(`UPDATE ${table} SET status = 'EXISTS', plainName = 'local' WHERE uuid = 'a'`).run();
    expect(repair().error).toBeInstanceOf(Error);
    database.prepare(`UPDATE ${table} SET plainName = 'a' WHERE uuid = 'a'`).run();
    expect(repair().error).toBeUndefined();
    expect(database.prepare(`SELECT plainName FROM ${table}`).get()?.plainName).toBe('remote');
    expect(repair().error).toBeUndefined();
    expect(
      execute({
        action: recovery.repairCandidate,
        input: { scanId: scan.scanId, uuid: 'a', item: { ...item, status: 'DELETED' } },
        transaction: true,
      }).error,
    ).toBeInstanceOf(Error);
  });

  it('requires all scans to complete before allocating preservation work', () => {
    // Given
    addCheckpoint({ itemType: 'folder' });
    const scans = start();
    beginScanning(scans);
    // When
    expect(
      execute({
        action: recovery.commitScanPage,
        input: { scanId: scans[0].scanId, observations: [], updatedAt: oldDate, complete: true },
        transaction: true,
      }).error,
    ).toBeUndefined();
    // Then
    expect(advance({ stage: 'preserving' }).error).toBeInstanceOf(Error);
    expect(
      recovery.accessDatabase({
        database,
        action: recovery.reserveDestination,
        input: { rootUuid: ctx.rootUuid, volume: 'C:\\', path: String.raw`C:\Recovery` },
        transaction: true,
      }).error,
    ).toBeInstanceOf(Error);
    expect(reserve({ scanId: scans[0].scanId }).error).toBeInstanceOf(Error);
  });

  it('resumes moves with their destinations and counts preservation once before conditional removal', () => {
    // Given
    insertItem({ uuid: 'a' });
    const scans = start();
    beginScanning(scans);
    beginPreserving(scans);
    const move = reserve({ scanId: scans[0].scanId }).data!;
    expect(
      recovery.accessDatabase({ database, action: completeMove, input: { moveId: move.moveId }, transaction: true }).error,
    ).toBeInstanceOf(Error);
    expect(advance({ stage: 'reporting' }).error).toBeInstanceOf(Error);
    // When
    reopen();
    expect(reserve({ scanId: scans[0].scanId }).data).toEqual(move);
    expect(recovery.listMoves({ database, scanId: scans[0].scanId, stage: 'pending', limit: 1 }).data).toEqual([move]);
    expect(recovery.listMovesBySource({ database, source: String.raw`c:\drive\A` }).data).toEqual([move]);
    expect(
      recovery.accessDatabase({
        database,
        action: markMovePreserved,
        input: { moveId: move.moveId, preservedFileCount: 3 },
        transaction: true,
      }).error,
    ).toBeUndefined();
    reopen();
    expect(
      recovery.accessDatabase({
        database,
        action: markMovePreserved,
        input: { moveId: move.moveId, preservedFileCount: 3 },
        transaction: true,
      }).error,
    ).toBeUndefined();
    // Then
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.preservedFileCount).toBe(3);
    expect(recovery.accessDatabase({ database, action: completeMove, input: { moveId: move.moveId }, transaction: true }).data).toEqual({
      applied: true,
    });

    expect(recovery.accessDatabase({ database, action: completeMove, input: { moveId: move.moveId }, transaction: true }).data).toEqual({
      applied: true,
    });
    expect(database.prepare("SELECT status FROM drive_file WHERE uuid = 'a'").get()?.status).toBe('DELETED');
    expect(
      recovery.accessDatabase({
        database,
        action: markMovePreserved,
        input: { moveId: move.moveId, preservedFileCount: 4 },
        transaction: true,
      }).error,
    ).toBeInstanceOf(Error);
  });

  it('rolls back a preservation count failure without losing the pending move', () => {
    // Given
    insertItem({ uuid: 'a' });
    const scans = start();
    beginScanning(scans);
    beginPreserving(scans);
    const move = reserve({ scanId: scans[0].scanId }).data!;
    database.exec(`CREATE TRIGGER fail_count BEFORE UPDATE OF preservedFileCount ON recovery_process
      BEGIN SELECT RAISE(ABORT, 'injected failure'); END`);

    // When
    expect(
      recovery.accessDatabase({
        database,
        action: markMovePreserved,
        input: { moveId: move.moveId, preservedFileCount: 1 },
        transaction: true,
      }).error,
    ).toBeInstanceOf(Error);
    // Then
    expect(recovery.listMoves({ database, scanId: scans[0].scanId, stage: 'pending' }).data).toEqual([move]);
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.preservedFileCount).toBe(0);
    expect(database.prepare("SELECT status FROM drive_file WHERE uuid = 'a'").get()?.status).toBe('EXISTS');
  });

  it('aggregates file and folder counts across volumes and reserves destinations exclusively', () => {
    // Given
    addCheckpoint({ itemType: 'folder' });
    insertItem({ uuid: 'a' });
    insertItem({ uuid: 'a', itemType: 'folder' });
    const scans = start();
    beginScanning(scans);
    beginPreserving(scans);
    expect(
      recovery.accessDatabase({
        database,
        action: recovery.reserveDestination,
        input: { rootUuid: ctx.rootUuid, volume: 'D:\\', path: String.raw`D:\Recovery` },
        transaction: true,
      }).error,
    ).toBeUndefined();
    expect(recovery.markDestinationCreated({ database, rootUuid: ctx.rootUuid, volume: 'D:\\' }).error).toBeUndefined();
    // When
    for (const [index, scan] of scans.entries()) {
      const volume = index === 0 ? 'C:\\' : 'D:\\';
      const move = recovery.accessDatabase({
        database,
        action: reserveMove,
        input: {
          scanId: scan.scanId,
          uuid: 'a',
          volume,
          source: `${volume}Drive\\a`,
          destination: `${volume}Recovery\\a`,
          removalStatus: 'DELETED',
        },
        transaction: true,
      }).data!;
      expect(
        recovery.accessDatabase({
          database,
          action: markMovePreserved,
          input: { moveId: move.moveId, preservedFileCount: index + 1 },
          transaction: true,
        }).error,
      ).toBeUndefined();

      expect(
        recovery.accessDatabase({ database, action: completeMove, input: { moveId: move.moveId }, transaction: true }).data?.applied,
      ).toBe(true);
      expect(recovery.listMoves({ database, scanId: scan.scanId, stage: 'completed' }).data).toHaveLength(1);
    }
    // Then
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.preservedFileCount).toBe(3);
    expect(recovery.listDestinations({ database, rootUuid: ctx.rootUuid, limit: 1 }).data).toHaveLength(1);
    expect(recovery.listDestinations({ database, rootUuid: ctx.rootUuid, after: 'C:\\', limit: 1 }).data?.[0].volume).toBe('D:\\');
    const other = { ...ctx, rootUuid: 'other-root', userUuid: 'initial' };
    start({ context: other });
    expect(advance({ rootUuid: other.rootUuid, stage: 'scanning' }).error).toBeUndefined();
    expect(advance({ rootUuid: other.rootUuid, stage: 'preserving' }).error).toBeUndefined();
    expect(
      recovery.accessDatabase({
        database,
        action: recovery.reserveDestination,
        input: { rootUuid: other.rootUuid, volume: 'C:\\', path: String.raw`c:\recovery` },
        transaction: true,
      }).error,
    ).toBeInstanceOf(Error);
  });

  it.each(['file', 'folder'] as const)('leaves changed or recreated %s state untouched when completing a move', (itemType) => {
    // Given
    if (itemType === 'folder') addCheckpoint({ itemType });
    insertItem({ uuid: 'a', itemType });
    const scans = start();
    beginScanning(scans);
    beginPreserving(scans);
    const scan = scans.find((value) => value.itemType === itemType)!;
    const move = reserve({ scanId: scan.scanId }).data!;
    expect(
      recovery.accessDatabase({
        database,
        action: markMovePreserved,
        input: { moveId: move.moveId, preservedFileCount: 1 },
        transaction: true,
      }).error,
    ).toBeUndefined();
    // When
    const table = itemType === 'file' ? 'drive_file' : 'drive_folder';
    database.prepare(`UPDATE ${table} SET modificationTime = ? WHERE uuid = 'a'`).run(checkpoint);
    // Then
    expect(recovery.accessDatabase({ database, action: completeMove, input: { moveId: move.moveId }, transaction: true }).data).toEqual({
      applied: false,
    });
    expect(recovery.listMoves({ database, scanId: scan.scanId, stage: 'conflict' }).data).toHaveLength(1);
    expect(database.prepare(`SELECT status FROM ${table}`).get()?.status).toBe('EXISTS');
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.preservedFileCount).toBe(1);
  });

  it('reserves operation paths exclusively, shares volumes and refuses observed items', () => {
    // Given
    ['a', 'b', 'c'].forEach((uuid) => insertItem({ uuid }));
    const scans = start();
    beginScanning(scans);
    expect(
      execute({
        action: recovery.commitScanPage,
        input: { scanId: scans[0].scanId, observations: [{ uuid: 'c' }], updatedAt: oldDate },
        transaction: true,
      }).error,
    ).toBeUndefined();
    beginPreserving(scans);
    // When
    expect(
      recovery.accessDatabase({
        database,
        action: recovery.reserveDestination,
        input: { rootUuid: ctx.rootUuid, volume: 'c:\\', path: String.raw`C:\Different` },
        transaction: true,
      }).data?.path,
    ).toBe(String.raw`C:\Recovery`);
    expect(reserve({ scanId: scans[0].scanId }).error).toBeUndefined();
    const collision = recovery.accessDatabase({
      database,
      action: reserveMove,
      input: {
        scanId: scans[0].scanId,
        uuid: 'b',
        volume: 'C:\\',
        source: String.raw`C:\Drive\b`,
        destination: 'c:/recovery/./A',
        removalStatus: 'DELETED',
      },
      transaction: true,
    });
    // Then
    expect(collision.error).toBeInstanceOf(Error);
    expect(recovery.listMoves({ database, scanId: scans[0].scanId, stage: 'pending' }).data).toHaveLength(1);
    expect(reserve({ scanId: scans[0].scanId, uuid: 'c' }).error).toBeInstanceOf(Error);
    expect(recovery.listDestinations({ database, rootUuid: ctx.rootUuid }).data).toHaveLength(1);
  });

  it('retains unfinished progress across restart and clears it after work finishes', () => {
    // Given
    insertItem({ uuid: 'a' });
    const scans = start();
    beginScanning(scans);
    expect(
      execute({
        action: recovery.commitScanPage,
        input: { scanId: scans[0].scanId, observations: [{ uuid: 'a' }], updatedAt: oldDate },
        transaction: true,
      }).error,
    ).toBeUndefined();
    // When
    reopen();
    const resumed = start({ startedAt: '2026-10-02T00:00:00.000Z' });
    // Then
    expect(resumed.map((scan) => scan.scanId)).toEqual(scans.map((scan) => scan.scanId));
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.startedAt).toBe(checkpoint);
    expect(recovery.getActiveScan({ database, rootUuid: ctx.rootUuid, itemType: 'file' }).data?.updatedAt).toBe(oldDate);
    expect(execute({ action: recovery.listCandidates, input: { scanId: scans[0].scanId } }).data?.[0].observed).toBe(1);
    expect(complete().error).toBeInstanceOf(Error);
    beginPreserving(scans);
    expect(advance({ stage: 'reporting' }).error).toBeUndefined();
    expect(complete().error).toBeUndefined();
    reopen();
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data).toBeUndefined();
    expect(recovery.getActiveScan({ database, rootUuid: ctx.rootUuid, itemType: 'file' }).data).toBeUndefined();
    expect(recovery.listScans({ database, rootUuid: ctx.rootUuid }).data).toEqual([]);
    expect(recovery.listUnfinishedProcesses({ database }).data).toEqual([]);
    const [next] = start();
    expect(next.updatedAt).toBe('1970-01-01T00:00:00.000Z');
    expect(next.scanId).toBeGreaterThan(scans[0].scanId);
  });

  it('rolls back completion and candidate cleanup when releasing scan progress fails', () => {
    // Given
    insertItem({ uuid: 'a' });
    const scans = start();
    beginScanning(scans);
    beginPreserving(scans);
    expect(advance({ stage: 'reporting' }).error).toBeUndefined();
    database.exec(`CREATE TRIGGER fail_release BEFORE DELETE ON recovery_scan
      BEGIN SELECT RAISE(ABORT, 'injected failure'); END`);
    // When
    const result = complete();
    // Then
    expect(result.error).toBeInstanceOf(Error);
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.stage).toBe('reporting');
    expect(recovery.getActiveScan({ database, rootUuid: ctx.rootUuid, itemType: 'file' }).data?.scanId).toBe(scans[0].scanId);
    expect(execute({ action: recovery.listCandidates, input: { scanId: scans[0].scanId } }).data).toHaveLength(1);
    database.exec('DROP TRIGGER fail_release');
    expect(complete().error).toBeUndefined();
  });

  it('retains move guards until events settle, then deletes all recovery state and starts fresh for the same root', () => {
    // Given
    insertItem({ uuid: 'a' });
    const scans = start();
    beginScanning(scans);
    beginPreserving(scans);
    const move = reserve({ scanId: scans[0].scanId }).data!;
    expect(releaseMoveGuard({ database, moveId: move.moveId }).error).toBeInstanceOf(Error);
    expect(
      recovery.accessDatabase({
        database,
        action: markMovePreserved,
        input: { moveId: move.moveId, preservedFileCount: 1 },
        transaction: true,
      }).error,
    ).toBeUndefined();

    expect(
      recovery.accessDatabase({ database, action: completeMove, input: { moveId: move.moveId }, transaction: true }).data?.applied,
    ).toBe(true);
    expect(advance({ stage: 'reporting' }).error).toBeInstanceOf(Error);
    // When
    expect(complete().error).toBeInstanceOf(Error);
    reopen();
    // Then
    expect(recovery.listMovesBySource({ database, source: String.raw`C:\Drive\a` }).data).toHaveLength(1);
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data?.preservedFileCount).toBe(1);
    expect(releaseMoveGuard({ database, moveId: move.moveId }).error).toBeUndefined();
    expect(advance({ stage: 'reporting' }).error).toBeUndefined();
    database.exec(`CREATE TRIGGER fail_destination_cleanup BEFORE DELETE ON recovery_destination
      BEGIN SELECT RAISE(ABORT, 'injected failure'); END`);
    expect(complete().error).toBeInstanceOf(Error);
    expect(recovery.listMoves({ database, scanId: scans[0].scanId, stage: 'completed' }).data).toHaveLength(1);
    expect(execute({ action: recovery.listCandidates, input: { scanId: scans[0].scanId } }).data).toHaveLength(1);
    database.exec('DROP TRIGGER fail_destination_cleanup');
    expect(complete().error).toBeUndefined();
    for (const table of ['recovery_process', 'recovery_scan', 'recovery_candidate', 'recovery_move', 'recovery_destination']) {
      expect(database.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get()?.total).toBe(0);
    }
    const [next] = start({ startedAt: '2026-10-02T00:00:00.000Z' });
    expect(recovery.getProcess({ database, rootUuid: ctx.rootUuid }).data).toMatchObject({
      startedAt: '2026-10-02T00:00:00.000Z',
      preservedFileCount: 0,
    });
    expect(next.updatedAt).toBe('1970-01-01T00:00:00.000Z');
    expect(next.scanId).toBeGreaterThan(scans[0].scanId);
    expect(recovery.listDestinations({ database, rootUuid: ctx.rootUuid }).data).toEqual([]);
    expect(recovery.listMovesBySource({ database, source: String.raw`C:\Drive\a` }).data).toEqual([]);
  });

  it('completes an empty recovery without a persisted notification or outcome', () => {
    // Given
    const context = { ...ctx, rootUuid: 'initial-root', userUuid: 'initial' };
    expect(start({ context })).toEqual([]);
    expect(advance({ rootUuid: context.rootUuid, stage: 'scanning' }).error).toBeUndefined();
    expect(advance({ rootUuid: context.rootUuid, stage: 'preserving' }).error).toBeUndefined();
    expect(advance({ rootUuid: context.rootUuid, stage: 'reporting' }).error).toBeUndefined();
    // When
    const result = complete(context.rootUuid);
    // Then
    expect(result.error).toBeUndefined();
    expect(recovery.getProcess({ database, rootUuid: context.rootUuid }).data).toBeUndefined();
    expect(recovery.listUnfinishedProcesses({ database }).data).toEqual([]);
  });

  it('traverses a multi-batch inventory and cleanup candidates with indexes and bounded results', () => {
    // Given
    database.exec('BEGIN');
    for (let index = 0; index < 2501; index++) insertItem({ uuid: String(index).padStart(5, '0') });
    database.exec('COMMIT');
    const [scan] = start();
    prepare(scan.scanId, 127);
    // When
    let after = '';
    let count = 0;
    for (;;) {
      const result = execute({
        action: recovery.listCandidates,
        input: { scanId: scan.scanId, after, limit: 113, selection: 'unobserved' },
      });
      expect(result.error).toBeUndefined();
      const rows = result.data!;
      expect(rows.length).toBeLessThanOrEqual(113);
      if (!rows.length) break;
      expect(rows[0].uuid > after).toBe(true);
      after = rows.at(-1)!.uuid;
      count += rows.length;
    }
    // Then
    expect(count).toBe(2501);
    const inventoryPlan = database
      .prepare(
        `EXPLAIN QUERY PLAN SELECT * FROM drive_file
      WHERE userUuid = ? AND workspaceId = ? AND uuid > ? AND uuid <= ? ORDER BY uuid LIMIT 1000`,
      )
      .all('user', '', '', '99999');
    expect(inventoryPlan.map((row) => row.detail).join(' ')).toContain('USING INDEX recovery_file_inventory');
    const cleanupPlan = database
      .prepare(`EXPLAIN QUERY PLAN ${candidateBatchQuery({ selection: 'unobserved' })}`)
      .all(scan.scanId, '', 1000);
    expect(cleanupPlan.map((row) => row.detail).join(' ')).toContain('USING INDEX recovery_unobserved');
    expect(execute({ action: recovery.listCandidates, input: { scanId: scan.scanId, limit: 1001 } }).error).toBeInstanceOf(Error);
    expect(
      execute({ action: recovery.prepareCandidates, input: { scanId: scan.scanId, limit: 0 }, transaction: true }).error,
    ).toBeInstanceOf(Error);
  });

  it('rejects invalid persisted values and returns database errors without throwing', () => {
    // Given
    insertItem({ uuid: 'a' });
    const [scan] = start();
    prepare(scan.scanId);
    // When
    database.prepare("UPDATE recovery_candidate SET original = '{}' WHERE scanId = ?").run(scan.scanId);
    // Then
    expect(execute({ action: recovery.listCandidates, input: { scanId: scan.scanId } }).error).toBeInstanceOf(Error);
    const closed = new DatabaseSync(':memory:');
    closed.close();
    expect(
      recovery.accessDatabase({ database: closed, action: recovery.getProcess, input: { rootUuid: ctx.rootUuid } }).error,
    ).toBeInstanceOf(Error);
  });
});
