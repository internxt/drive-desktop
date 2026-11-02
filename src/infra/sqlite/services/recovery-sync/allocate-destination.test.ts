import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { allocateDestination } from './allocate-destination';
import { clearTables, getDestinations } from './recovery-sync.helper.test';

describe('allocate-destination', () => {
  let props: Parameters<typeof allocateDestination>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    clearTables();
    props = { rootUuid: 'rootUuid', volume: 'C:', path: String.raw`C:\Internxt Recovery Sync 2026-01-01 100000` };
  });

  it('should allocate the path for the volume', () => {
    // When
    const { data } = allocateDestination(props);
    // Then
    expect(data).toMatchObject({ rootUuid: 'rootUuid', volume: 'C:', path: String.raw`C:\Internxt Recovery Sync 2026-01-01 100000` });
  });

  it('should keep the path allocated first for the volume', () => {
    // Given
    allocateDestination(props);
    props.path = String.raw`C:\Internxt Recovery Sync 2026-01-01 110000`;
    // When
    const { data } = allocateDestination(props);
    // Then
    expect(data).toMatchObject({ path: String.raw`C:\Internxt Recovery Sync 2026-01-01 100000` });
    expect(getDestinations()).toHaveLength(1);
  });

  it('should allocate one path per volume and root', () => {
    // Given
    allocateDestination(props);
    allocateDestination({ ...props, rootUuid: 'otherRootUuid' });
    // When
    allocateDestination({ ...props, volume: 'D:', path: String.raw`D:\Internxt Recovery Sync 2026-01-01 100000` });
    // Then
    expect(getDestinations()).toMatchObject([
      { rootUuid: 'otherRootUuid', volume: 'C:' },
      { rootUuid: 'rootUuid', volume: 'C:' },
      { rootUuid: 'rootUuid', volume: 'D:' },
    ]);
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.rootUuid = (() => null) as any;
    // When
    const { error } = allocateDestination(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ msg: 'Error allocating recovery sync destination' });
  });
});
