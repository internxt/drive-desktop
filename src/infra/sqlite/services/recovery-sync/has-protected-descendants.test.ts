import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { hasProtectedDescendants } from './has-protected-descendants';
import { CHECKPOINT, clearTables, getScope, insertFile, insertFolder, insertObserved, insertScan } from './recovery-sync.helper.test';

describe('has-protected-descendants', () => {
  let props: Parameters<typeof hasProtectedDescendants>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    clearTables();
    insertScan({ itemType: 'file', completed: 1 });
    insertScan({ itemType: 'folder', completed: 1 });
    insertFolder({ uuid: 'folder1', parentUuid: 'root' });
    insertFolder({ uuid: 'folder2', parentUuid: 'folder1' });
    insertFile({ uuid: 'file1', folderUuid: 'folder2' });
    props = { ...getScope(), folderUuid: 'folder1' };
  });

  it('should return false when every descendant can be removed', () => {
    // When
    const { data } = hasProtectedDescendants(props);
    // Then
    expect(data).toBe(false);
  });

  it('should return true when the scan saw a nested file existing', () => {
    // Given
    insertObserved({ itemType: 'file', uuid: 'file1', remoteStatus: 'EXISTS' });
    // When
    const { data } = hasProtectedDescendants(props);
    // Then
    expect(data).toBe(true);
  });

  it('should return true when a nested folder was updated at the checkpoint', () => {
    // Given
    insertFolder({ uuid: 'folder3', parentUuid: 'folder2', updatedAt: CHECKPOINT });
    // When
    const { data } = hasProtectedDescendants(props);
    // Then
    expect(data).toBe(true);
  });

  it('should return true when the scan of a descendant type is not completed', () => {
    // Given
    db.exec(`UPDATE recovery_sync_scan SET completed = 0 WHERE itemType = 'file'`);
    // When
    const { data } = hasProtectedDescendants(props);
    // Then
    expect(data).toBe(true);
  });

  it('should not follow descendants that are already removed locally', () => {
    // Given
    db.exec(`UPDATE drive_folder SET status = 'TRASHED' WHERE uuid = 'folder2'`);
    insertObserved({ itemType: 'file', uuid: 'file1', remoteStatus: 'EXISTS' });
    // When
    const { data } = hasProtectedDescendants(props);
    // Then
    expect(data).toBe(false);
  });

  it('should not look at items outside the folder or the scope', () => {
    // Given
    insertFile({ uuid: 'file2', folderUuid: 'root', updatedAt: CHECKPOINT });
    insertFile({ uuid: 'file3', folderUuid: 'folder2', updatedAt: CHECKPOINT, workspaceId: 'workspaceId' });
    // When
    const { data } = hasProtectedDescendants(props);
    // Then
    expect(data).toBe(false);
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.folderUuid = (() => null) as any;
    // When
    const { error } = hasProtectedDescendants(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ msg: 'Error checking protected recovery sync descendants' });
  });
});
