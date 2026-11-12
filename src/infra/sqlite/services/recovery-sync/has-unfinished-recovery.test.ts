import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { hasUnfinishedRecovery } from './has-unfinished-recovery';
import { clearTables, insertProcess } from './recovery-sync.helper.test';

describe('has-unfinished-recovery', () => {
  let props: Parameters<typeof hasUnfinishedRecovery>[0];

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

  it('should return true when the root has a process', () => {
    // Given
    insertProcess({ startedAt: '2026-01-01T00:00:00.000Z' });
    // When
    const { data } = hasUnfinishedRecovery(props);
    // Then
    expect(data).toBe(true);
  });

  it('should return false when only another root has a process', () => {
    // Given
    insertProcess({ rootUuid: 'otherRootUuid', startedAt: '2026-01-01T00:00:00.000Z' });
    // When
    const { data } = hasUnfinishedRecovery(props);
    // Then
    expect(data).toBe(false);
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.rootUuid = (() => null) as any;
    // When
    const { error } = hasUnfinishedRecovery(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ tag: 'RECOVERY-SYNC', msg: 'Error checking unfinished recovery sync' });
  });
});
