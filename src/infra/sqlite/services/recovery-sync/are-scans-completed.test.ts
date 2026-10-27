import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { areScansCompleted } from './are-scans-completed';
import { clearTables, insertScan } from './recovery.helper.test';

describe('are-scans-completed', () => {
  let props: Parameters<typeof areScansCompleted>[0];

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

  it('should return false when the root has no scans', () => {
    // When
    const { data } = areScansCompleted(props);
    // Then
    expect(data).toBe(false);
  });

  it('should return false while any scan is incomplete', () => {
    // Given
    insertScan({ itemType: 'file', completed: 1 });
    insertScan({ itemType: 'folder', completed: 0 });
    // When
    const { data } = areScansCompleted(props);
    // Then
    expect(data).toBe(false);
  });

  it('should return true when every scan is completed', () => {
    // Given
    insertScan({ itemType: 'file', completed: 1 });
    insertScan({ itemType: 'folder', completed: 1 });
    // When
    const { data } = areScansCompleted(props);
    // Then
    expect(data).toBe(true);
  });

  it('should ignore scans from other roots', () => {
    // Given
    insertScan({ itemType: 'file', completed: 1 });
    insertScan({ itemType: 'file', rootUuid: 'otherRootUuid', completed: 0 });
    // When
    const { data } = areScansCompleted(props);
    // Then
    expect(data).toBe(true);
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.rootUuid = (() => null) as any;
    // When
    const { error } = areScansCompleted(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ error: { message: expect.stringContaining('cannot be bound') } });
  });
});
