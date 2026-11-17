import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { createOrUpdate } from '../checkpoint/create-or-update';
import { CHECKPOINT, clearTables, getScans } from './recovery-sync.helper.test';
import { startOrResumeScan } from './start-or-resume-scan';

describe('start-or-resume-scan', () => {
  let props: Parameters<typeof startOrResumeScan>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    clearTables();
    props = { rootUuid: 'rootUuid', userUuid: 'userUuid', workspaceId: '', itemType: 'file' };
  });

  it('should return NOT_FOUND when the item type has no checkpoint', () => {
    // When
    const { error } = startOrResumeScan(props);
    // Then
    expect(error?.code).toBe('NOT_FOUND');
    expect(getScans()).toStrictEqual([]);
  });

  it('should start a scan from the epoch capturing the checkpoint', () => {
    // Given
    createOrUpdate({ type: 'file', name: 'file', updatedAt: CHECKPOINT, userUuid: 'userUuid', workspaceId: '' });
    // When
    const { data } = startOrResumeScan(props);
    // Then
    expect(data).toMatchObject({
      rootUuid: 'rootUuid',
      itemType: 'file',
      checkpoint: CHECKPOINT,
      updatedAt: '1970-01-01T00:00:00.000Z',
      completed: 0,
    });
  });

  it('should resume an existing scan keeping its captured checkpoint and progress', () => {
    // Given
    createOrUpdate({ type: 'file', name: 'file', updatedAt: CHECKPOINT, userUuid: 'userUuid', workspaceId: '' });
    startOrResumeScan(props);
    db.prepare(`UPDATE recovery_sync_scan SET updatedAt = '2025-06-01T00:00:00.000Z'`).run();
    createOrUpdate({ type: 'file', name: 'file', updatedAt: '2026-02-01T00:00:00.000Z', userUuid: 'userUuid', workspaceId: '' });
    // When
    const { data } = startOrResumeScan(props);
    // Then
    expect(data).toMatchObject({ checkpoint: CHECKPOINT, updatedAt: '2025-06-01T00:00:00.000Z' });
    expect(getScans()).toHaveLength(1);
  });

  it('should keep personal and workspace scans separate', () => {
    // Given
    createOrUpdate({ type: 'file', name: 'file', updatedAt: CHECKPOINT, userUuid: 'userUuid', workspaceId: '' });
    createOrUpdate({ type: 'file', name: 'file', updatedAt: '2026-03-01T00:00:00.000Z', userUuid: 'userUuid', workspaceId: 'workspaceId' });
    // When
    const personal = startOrResumeScan(props);
    const workspace = startOrResumeScan({ ...props, rootUuid: 'workspaceRootUuid', workspaceId: 'workspaceId' });
    // Then
    expect(personal.data).toMatchObject({ rootUuid: 'rootUuid', checkpoint: CHECKPOINT });
    expect(workspace.data).toMatchObject({ rootUuid: 'workspaceRootUuid', checkpoint: '2026-03-01T00:00:00.000Z' });
  });

  it('should keep file and folder scans separate', () => {
    // Given
    createOrUpdate({ type: 'file', name: 'file', updatedAt: CHECKPOINT, userUuid: 'userUuid', workspaceId: '' });
    // When
    const file = startOrResumeScan(props);
    const folder = startOrResumeScan({ ...props, itemType: 'folder' });
    // Then
    expect(file.data).toMatchObject({ itemType: 'file' });
    expect(folder.error?.code).toBe('NOT_FOUND');
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.userUuid = (() => null) as any;
    // When
    const { error } = startOrResumeScan(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ error: { message: expect.stringContaining('cannot be bound') } });
  });
});
