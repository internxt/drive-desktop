import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { getFilesToPreserve, getFoldersToPreserve } from './get-items-to-preserve';
import { CHECKPOINT, clearTables, getScope, insertFile, insertFolder, insertObserved, insertScan } from './recovery.helper.test';

describe('get-items-to-preserve', () => {
  let props: Parameters<typeof getFilesToPreserve>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    clearTables();
    insertScan({ itemType: 'file', completed: 1 });
    props = getScope();
  });

  it('should return nothing while the scan is not completed', () => {
    // Given
    db.exec('UPDATE recovery_sync_scan SET completed = 0');
    insertFile({ uuid: 'uuid1' });
    // When
    const { data } = getFilesToPreserve(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return unobserved items as DELETED and removed items with their remote status', () => {
    // Given
    insertFile({ uuid: 'uuid1' });
    insertFile({ uuid: 'uuid2' });
    insertFile({ uuid: 'uuid3' });
    insertObserved({ itemType: 'file', uuid: 'uuid2', remoteStatus: 'TRASHED' });
    insertObserved({ itemType: 'file', uuid: 'uuid3', remoteStatus: 'EXISTS' });
    // When
    const { data } = getFilesToPreserve(props);
    // Then
    expect(data).toMatchObject([
      { item: { uuid: 'uuid1', name: 'file.txt', parentUuid: 'folderUuid' }, removalStatus: 'DELETED' },
      { item: { uuid: 'uuid2' }, removalStatus: 'TRASHED' },
    ]);
  });

  it('should not return items updated at or after the checkpoint', () => {
    // Given
    insertFile({ uuid: 'uuid1', updatedAt: CHECKPOINT });
    insertFile({ uuid: 'uuid2', updatedAt: '2026-02-01T00:00:00.000Z' });
    // When
    const { data } = getFilesToPreserve(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should not return items that are already removed locally', () => {
    // Given
    insertFile({ uuid: 'uuid1', status: 'TRASHED' });
    insertFile({ uuid: 'uuid2', status: 'DELETED' });
    // When
    const { data } = getFilesToPreserve(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should not return items from another workspace', () => {
    // Given
    insertFile({ uuid: 'uuid1', workspaceId: 'workspaceId' });
    // When
    const { data } = getFilesToPreserve(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should not use observations from another root', () => {
    // Given
    insertFile({ uuid: 'uuid1' });
    insertObserved({ itemType: 'file', uuid: 'uuid1', remoteStatus: 'EXISTS', rootUuid: 'otherRootUuid' });
    // When
    const { data } = getFilesToPreserve(props);
    // Then
    expect(data).toMatchObject([{ item: { uuid: 'uuid1' }, removalStatus: 'DELETED' }]);
  });

  it('should return items in uuid batches', () => {
    // Given
    insertFile({ uuid: 'uuid1' });
    insertFile({ uuid: 'uuid2' });
    insertFile({ uuid: 'uuid3' });
    // When
    const first = getFilesToPreserve({ ...props, limit: 2 });
    const second = getFilesToPreserve({ ...props, limit: 2, afterUuid: 'uuid2' });
    // Then
    expect(first.data?.map(({ item }) => item.uuid)).toStrictEqual(['uuid1', 'uuid2']);
    expect(second.data?.map(({ item }) => item.uuid)).toStrictEqual(['uuid3']);
  });

  it('should return folders', () => {
    // Given
    insertScan({ itemType: 'folder', completed: 1 });
    insertFolder({ uuid: 'uuid1' });
    insertFile({ uuid: 'uuid1' });
    insertObserved({ itemType: 'file', uuid: 'uuid1', remoteStatus: 'EXISTS' });
    // When
    const { data } = getFoldersToPreserve(props);
    // Then
    expect(data).toMatchObject([{ item: { uuid: 'uuid1', name: 'folder', parentUuid: 'parentUuid' }, removalStatus: 'DELETED' }]);
  });

  it('should return INVALID_ROW when a row does not match the item shape', () => {
    // Given
    insertFile({ uuid: 'uuid1', size: 'invalid' as any });
    // When
    const { error } = getFilesToPreserve(props);
    // Then
    expect(error?.code).toBe('INVALID_ROW');
    call(loggerMock.error).toMatchObject({ msg: 'Invalid recovery item to preserve' });
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.userUuid = (() => null) as any;
    // When
    const { error } = getFilesToPreserve(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ error: { message: expect.stringContaining('cannot be bound') } });
  });
});
