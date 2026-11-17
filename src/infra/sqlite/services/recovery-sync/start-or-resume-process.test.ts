import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { clearTables, getProcesses, insertProcess } from './recovery-sync.helper.test';
import { startOrResumeProcess } from './start-or-resume-process';

describe('start-or-resume-process', () => {
  let props: Parameters<typeof startOrResumeProcess>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    clearTables();
    props = { rootUuid: 'rootUuid', startedAt: '2026-01-01T10:00:00.000Z' };
  });

  it('should create the process of the root with the given start time', () => {
    // Given
    insertProcess({ rootUuid: 'otherRootUuid', startedAt: '2025-01-01T00:00:00.000Z' });
    // When
    const { data } = startOrResumeProcess(props);
    // Then
    expect(data).toMatchObject({ rootUuid: 'rootUuid', startedAt: '2026-01-01T10:00:00.000Z' });
    expect(getProcesses()).toHaveLength(2);
  });

  it('should resume the process of the root keeping its start time', () => {
    // Given
    insertProcess({ startedAt: '2025-06-01T00:00:00.000Z' });
    // When
    const { data } = startOrResumeProcess(props);
    // Then
    expect(data).toMatchObject({ rootUuid: 'rootUuid', startedAt: '2025-06-01T00:00:00.000Z' });
    expect(getProcesses()).toHaveLength(1);
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.rootUuid = (() => null) as any;
    // When
    const { error } = startOrResumeProcess(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ msg: 'Error starting or resuming recovery sync process' });
  });
});
