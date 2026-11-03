import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { clearRecovery } from './clear-recovery';
import { clearTables, getObserved, getProcesses, getScans, insertObserved, insertProcess, insertScan } from './recovery-sync.helper.test';

describe('clear-recovery', () => {
  let props: Parameters<typeof clearRecovery>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    clearTables();
    props = { rootUuid: 'rootUuid' };
  });

  it('should remove the process, scans and observations of the root only', () => {
    // Given
    insertProcess({ startedAt: '2026-01-01T10:00:00.000Z' });
    insertScan({ itemType: 'file', completed: 1 });
    insertScan({ itemType: 'folder', completed: 1 });
    insertObserved({ itemType: 'file', uuid: 'uuid1', remoteStatus: 'EXISTS' });
    insertProcess({ startedAt: '2026-01-01T10:00:00.000Z', rootUuid: 'otherRootUuid' });
    insertScan({ itemType: 'file', rootUuid: 'otherRootUuid' });
    insertObserved({ itemType: 'file', uuid: 'uuid1', remoteStatus: 'EXISTS', rootUuid: 'otherRootUuid' });
    // When
    const { error } = clearRecovery(props);
    // Then
    expect(error).toBeUndefined();
    expect(getProcesses()).toMatchObject([{ rootUuid: 'otherRootUuid' }]);
    expect(getScans()).toMatchObject([{ rootUuid: 'otherRootUuid' }]);
    expect(getObserved()).toMatchObject([{ rootUuid: 'otherRootUuid' }]);
  });

  it('should return UNKNOWN and roll back when error is thrown', () => {
    // Given
    insertScan({ itemType: 'file' });
    props.rootUuid = (() => null) as any;
    // When
    const { error } = clearRecovery(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    expect(db.isTransaction).toBe(false);
    expect(getScans()).toHaveLength(1);
    call(loggerMock.error).toMatchObject({ error: { message: expect.stringContaining('cannot be bound') } });
  });
});
