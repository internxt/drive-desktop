import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { DriveServerWipError } from '@/infra/drive-server-wip/defs';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { db, runMigrations } from '@/infra/sqlite/migrations/run-migrations';
import {
  CHECKPOINT,
  clearTables,
  getObserved,
  getScans,
  insertFile,
  insertFolder,
} from '@/infra/sqlite/services/recovery-sync/recovery-sync.helper.test';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { scanRecoverySync } from './scan-recovery-sync';
import { scanRecoverySyncFiles } from './scan-recovery-sync-files';
import { scanRecoverySyncFolders } from './scan-recovery-sync-folders';

describe('scan-recovery-sync', () => {
  const getFilesMock = partialSpyOn(driveServerWip.files, 'getFilesSyncPage');
  const getFoldersMock = partialSpyOn(driveServerWip.folders, 'getFoldersSyncPage');
  const getWorkspaceFilesMock = partialSpyOn(driveServerWip.workspaces, 'getFilesSyncPage');
  const getWorkspaceFoldersMock = partialSpyOn(driveServerWip.workspaces, 'getFoldersSyncPage');

  const T1 = '2025-01-01T00:00:00.000Z';
  const T2 = '2025-02-01T00:00:00.000Z';
  const AFTER_CHECKPOINT = '2026-02-01T00:00:00.000Z';

  type Status = 'EXISTS' | 'TRASHED' | 'DELETED';

  function remoteFile(uuid: string, updatedAt: string, status: Status = 'EXISTS') {
    return {
      id: 1,
      uuid: uuid as FileUuid,
      status,
      plainName: `remote-${uuid}`,
      type: 'txt',
      fileId: 'fileId',
      size: '2048',
      folderId: 1,
      folderUuid: 'folderUuid',
      createdAt: T1,
      updatedAt,
      creationTime: T1,
      modificationTime: T1,
    };
  }

  function remoteFolder(uuid: string, updatedAt: string, status: Status = 'EXISTS') {
    return {
      id: 1,
      uuid: uuid as FolderUuid,
      status,
      plainName: `remote-${uuid}`,
      parentId: 1,
      parentUuid: 'parentUuid',
      createdAt: T1,
      updatedAt,
      creationTime: T1,
      modificationTime: T1,
    };
  }

  function getFiles() {
    return db.prepare('SELECT uuid, plainName, status, updatedAt, size, workspaceId FROM drive_file ORDER BY uuid').all();
  }

  function getFolders() {
    return db.prepare('SELECT uuid, plainName, status, updatedAt, workspaceId FROM drive_folder ORDER BY uuid').all();
  }

  function getCheckpoints() {
    return db.prepare('SELECT type, updatedAt, workspaceId FROM checkpoint ORDER BY type, workspaceId').all();
  }

  function insertCheckpoint({ type, workspaceId = '' }: { type: 'file' | 'folder'; workspaceId?: string }) {
    SqliteModule.CheckpointModule.createOrUpdate({ type, userUuid: 'userUuid', workspaceId, name: 'name', updatedAt: CHECKPOINT });
  }

  let props: Parameters<typeof scanRecoverySync>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    clearTables();
    getFilesMock.mockResolvedValue({ data: { items: [], nextCursor: null } });
    getFoldersMock.mockResolvedValue({ data: { items: [], nextCursor: null } });

    props = mockProps<typeof scanRecoverySync>({
      ctx: { rootUuid: 'rootUuid' as any, userUuid: 'userUuid', workspaceId: '', abortController: new AbortController() },
    });
  });

  it('should repair missing and stale files across pages and only observe removed files', async () => {
    // Given
    insertCheckpoint({ type: 'file' });
    insertFile({ uuid: 'stale', plainName: 'local-stale', updatedAt: '2024-06-01T00:00:00.000Z' });
    insertFile({ uuid: 'current', plainName: 'local-current', updatedAt: T2 });
    insertFile({ uuid: 'trashed', plainName: 'local-trashed', updatedAt: T1 });
    insertFile({ uuid: 'deleted', plainName: 'local-deleted', updatedAt: T1 });
    getFilesMock
      .mockResolvedValueOnce({ data: { items: [remoteFile('stale', T1), remoteFile('missing', T1)], nextCursor: 'cursor-1' } })
      .mockResolvedValueOnce({
        data: {
          items: [
            remoteFile('current', T2),
            remoteFile('trashed', T2, 'TRASHED'),
            remoteFile('deleted', T2, 'DELETED'),
            remoteFile('newer', AFTER_CHECKPOINT),
          ],
          nextCursor: null,
        },
      });
    // When
    const { error } = await scanRecoverySyncFiles(props);
    // Then
    expect(error).toBeUndefined();
    calls(getFilesMock).toMatchObject([
      { context: { query: { updatedAt: '1970-01-01T00:00:00.000Z', limit: 1000 } } },
      { context: { query: { cursor: 'cursor-1', limit: 1000 } } },
    ]);

    expect(getFiles()).toEqual([
      { uuid: 'current', plainName: 'local-current', status: 'EXISTS', updatedAt: T2, size: 1024, workspaceId: '' },
      { uuid: 'deleted', plainName: 'local-deleted', status: 'EXISTS', updatedAt: T1, size: 1024, workspaceId: '' },
      { uuid: 'missing', plainName: 'remote-missing', status: 'EXISTS', updatedAt: T1, size: 2048, workspaceId: '' },
      { uuid: 'stale', plainName: 'remote-stale', status: 'EXISTS', updatedAt: T1, size: 2048, workspaceId: '' },
      { uuid: 'trashed', plainName: 'local-trashed', status: 'EXISTS', updatedAt: T1, size: 1024, workspaceId: '' },
    ]);

    expect(getObserved()).toMatchObject([
      { uuid: 'current', remoteStatus: 'EXISTS' },
      { uuid: 'deleted', remoteStatus: 'DELETED' },
      { uuid: 'missing', remoteStatus: 'EXISTS' },
      { uuid: 'newer', remoteStatus: 'EXISTS' },
      { uuid: 'stale', remoteStatus: 'EXISTS' },
      { uuid: 'trashed', remoteStatus: 'TRASHED' },
    ]);
    expect(getScans()).toMatchObject([{ itemType: 'file', checkpoint: CHECKPOINT, updatedAt: AFTER_CHECKPOINT, completed: 1 }]);
    expect(getCheckpoints()).toEqual([{ type: 'file', updatedAt: CHECKPOINT, workspaceId: '' }]);
  });

  it('should resume an interrupted scan and observe every folder sharing a timestamp across pages', async () => {
    // Given
    insertCheckpoint({ type: 'folder' });
    getFoldersMock
      .mockResolvedValueOnce({ data: { items: [remoteFolder('a', T1), remoteFolder('b', T2)], nextCursor: 'cursor-1' } })
      .mockResolvedValueOnce({ error: new DriveServerWipError('NETWORK', 'cause') });
    const interrupted = await scanRecoverySyncFolders(props);
    getFoldersMock.mockResolvedValueOnce({
      data: { items: [remoteFolder('b', T2), remoteFolder('c', T2, 'TRASHED'), remoteFolder('d', T2)], nextCursor: null },
    });
    // When
    const { error } = await scanRecoverySyncFolders(props);
    // Then
    expect(interrupted.error?.message).toBe('NETWORK');
    expect(error).toBeUndefined();
    calls(getFoldersMock).toMatchObject([
      { context: { query: { updatedAt: '1970-01-01T00:00:00.000Z' } } },
      { context: { query: { cursor: 'cursor-1' } } },
      { context: { query: { updatedAt: '2025-01-31T23:59:59.999Z' } } },
    ]);

    expect(getObserved()).toMatchObject([
      { itemType: 'folder', uuid: 'a', remoteStatus: 'EXISTS' },
      { itemType: 'folder', uuid: 'b', remoteStatus: 'EXISTS' },
      { itemType: 'folder', uuid: 'c', remoteStatus: 'TRASHED' },
      { itemType: 'folder', uuid: 'd', remoteStatus: 'EXISTS' },
    ]);
    expect(getFolders()).toMatchObject([{ uuid: 'a' }, { uuid: 'b' }, { uuid: 'd' }]);
    expect(getScans()).toMatchObject([{ itemType: 'folder', updatedAt: T2, completed: 1 }]);
    expect(getCheckpoints()).toEqual([{ type: 'folder', updatedAt: CHECKPOINT, workspaceId: '' }]);
  });

  it('should not complete the scan when a page does not match the expected response', async () => {
    // Given
    insertCheckpoint({ type: 'file' });
    getFilesMock.mockResolvedValue({ data: { items: [{ ...remoteFile('a', T1), size: '-1' }], nextCursor: null } });
    // When
    const { error } = await scanRecoverySyncFiles(props);
    // Then
    expect(error?.message).toBe('Invalid recovery sync files page');
    expect(getScans()).toMatchObject([{ itemType: 'file', updatedAt: '1970-01-01T00:00:00.000Z', completed: 0 }]);
    expect(getObserved()).toStrictEqual([]);
  });

  it('should not complete the scan when aborted', async () => {
    // Given
    insertCheckpoint({ type: 'file' });
    getFilesMock.mockImplementation(() => {
      props.ctx.abortController.abort();
      return Promise.resolve({ data: { items: [remoteFile('a', T1)], nextCursor: null } });
    });
    // When
    const { error } = await scanRecoverySyncFiles(props);
    // Then
    expect(error?.name).toBe('AbortError');
    expect(getScans()).toMatchObject([{ itemType: 'file', completed: 0 }]);
    expect(getFiles()).toStrictEqual([]);
    expect(getObserved()).toStrictEqual([]);
  });

  it('should scan a workspace with its own requests, rows and progress', async () => {
    // Given
    props.ctx = mockProps<typeof scanRecoverySync>({
      ctx: {
        rootUuid: 'workspaceRootUuid' as any,
        userUuid: 'userUuid',
        workspaceId: 'workspaceId',
        abortController: new AbortController(),
      },
    }).ctx;
    insertCheckpoint({ type: 'file' });
    insertCheckpoint({ type: 'file', workspaceId: 'workspaceId' });
    insertCheckpoint({ type: 'folder', workspaceId: 'workspaceId' });
    insertFolder({ uuid: 'personal', updatedAt: T1 });
    insertFile({ uuid: 'personal-file', updatedAt: T1 });
    getWorkspaceFilesMock.mockResolvedValue({ data: { items: [remoteFile('file', T1)], nextCursor: null } });
    getWorkspaceFoldersMock.mockResolvedValue({ data: { items: [remoteFolder('folder', T1)], nextCursor: null } });
    // When
    const { error } = await scanRecoverySync(props);
    // Then
    expect(error).toBeUndefined();
    calls(getFilesMock).toHaveLength(0);
    calls(getFoldersMock).toHaveLength(0);
    expect(getFiles()).toMatchObject([
      { uuid: 'file', workspaceId: 'workspaceId' },
      { uuid: 'personal-file', workspaceId: '' },
    ]);

    expect(getFolders()).toMatchObject([
      { uuid: 'folder', workspaceId: 'workspaceId' },
      { uuid: 'personal', plainName: 'folder', workspaceId: '' },
    ]);

    expect(getScans()).toMatchObject([
      { rootUuid: 'workspaceRootUuid', itemType: 'file', completed: 1 },
      { rootUuid: 'workspaceRootUuid', itemType: 'folder', completed: 1 },
    ]);

    expect(getCheckpoints()).toEqual([
      { type: 'file', updatedAt: CHECKPOINT, workspaceId: '' },
      { type: 'file', updatedAt: CHECKPOINT, workspaceId: 'workspaceId' },
      { type: 'folder', updatedAt: CHECKPOINT, workspaceId: 'workspaceId' },
    ]);
  });

  it('should skip item types without a normal checkpoint', async () => {
    // Given
    insertCheckpoint({ type: 'file' });
    // When
    const { error } = await scanRecoverySync(props);
    // Then
    expect(error).toBeUndefined();
    calls(getFoldersMock).toHaveLength(0);
    expect(getScans()).toMatchObject([{ itemType: 'file', completed: 1 }]);
  });
});
