import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { clearRecovery } from './clear-recovery';
import { clearTables, getObserved, getScans, insertObserved, insertScan } from './recovery.helper.test';

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

  it('should remove scans and observations of the root only', () => {
    // Given
    insertScan({ itemType: 'file', completed: 1 });
    insertScan({ itemType: 'folder', completed: 1 });
    insertObserved({ itemType: 'file', uuid: 'uuid1', remoteStatus: 'EXISTS' });
    insertScan({ itemType: 'file', rootUuid: 'otherRootUuid' });
    insertObserved({ itemType: 'file', uuid: 'uuid1', remoteStatus: 'EXISTS', rootUuid: 'otherRootUuid' });
    // When
    const { error } = clearRecovery(props);
    // Then
    expect(error).toBeUndefined();
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
