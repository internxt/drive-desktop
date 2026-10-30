import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { markRemovedIfEligible } from './mark-removed-if-eligible';
import { clearTables, getScope, insertFile, insertFolder, insertObserved, insertScan } from './recovery-sync.helper.test';

describe('mark-removed-if-eligible', () => {
  let props: Parameters<typeof markRemovedIfEligible>[0];

  function getStatus(table: 'drive_file' | 'drive_folder') {
    return db.prepare(`SELECT status FROM ${table} WHERE uuid = 'uuid1'`).get()?.status;
  }

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    clearTables();
    insertScan({ itemType: 'file', completed: 1 });
    insertFile({ uuid: 'uuid1' });
    props = { ...getScope(), itemType: 'file', uuid: 'uuid1', removalStatus: 'DELETED' };
  });

  it('should mark an unobserved item as DELETED', () => {
    // When
    const { data } = markRemovedIfEligible(props);
    // Then
    expect(data).toBe(true);
    expect(getStatus('drive_file')).toBe('DELETED');
  });

  it('should mark an item with the remote removal status', () => {
    // Given
    insertObserved({ itemType: 'file', uuid: 'uuid1', remoteStatus: 'TRASHED' });
    // When
    const { data } = markRemovedIfEligible({ ...props, removalStatus: 'TRASHED' });
    // Then
    expect(data).toBe(true);
    expect(getStatus('drive_file')).toBe('TRASHED');
  });

  it('should skip an item whose remote status differs from the requested one', () => {
    // Given
    insertObserved({ itemType: 'file', uuid: 'uuid1', remoteStatus: 'TRASHED' });
    // When
    const { data } = markRemovedIfEligible(props);
    // Then
    expect(data).toBe(false);
    expect(getStatus('drive_file')).toBe('EXISTS');
  });

  it('should skip an item that exists remotely', () => {
    // Given
    insertObserved({ itemType: 'file', uuid: 'uuid1', remoteStatus: 'EXISTS' });
    // When
    const { data } = markRemovedIfEligible(props);
    // Then
    expect(data).toBe(false);
    expect(getStatus('drive_file')).toBe('EXISTS');
  });

  it('should skip an item that was updated after the checkpoint', () => {
    // Given
    insertFile({ uuid: 'uuid1', updatedAt: '2026-02-01T00:00:00.000Z' });
    // When
    const { data } = markRemovedIfEligible(props);
    // Then
    expect(data).toBe(false);
    expect(getStatus('drive_file')).toBe('EXISTS');
  });

  it('should skip an item that was removed locally', () => {
    // Given
    insertFile({ uuid: 'uuid1', status: 'TRASHED' });
    // When
    const { data } = markRemovedIfEligible(props);
    // Then
    expect(data).toBe(false);
    expect(getStatus('drive_file')).toBe('TRASHED');
  });

  it('should skip items while the scan is not completed', () => {
    // Given
    db.exec('UPDATE recovery_sync_scan SET completed = 0');
    // When
    const { data } = markRemovedIfEligible(props);
    // Then
    expect(data).toBe(false);
    expect(getStatus('drive_file')).toBe('EXISTS');
  });

  it('should skip items from another workspace', () => {
    // When
    const { data } = markRemovedIfEligible({ ...props, workspaceId: 'workspaceId' });
    // Then
    expect(data).toBe(false);
  });

  it('should mark folders', () => {
    // Given
    insertScan({ itemType: 'folder', completed: 1 });
    insertFolder({ uuid: 'uuid1' });
    // When
    const { data } = markRemovedIfEligible({ ...props, itemType: 'folder' });
    // Then
    expect(data).toBe(true);
    expect(getStatus('drive_folder')).toBe('DELETED');
    expect(getStatus('drive_file')).toBe('EXISTS');
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.uuid = (() => null) as any;
    // When
    const { error } = markRemovedIfEligible(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ error: { message: expect.stringContaining('cannot be bound') } });
  });
});
