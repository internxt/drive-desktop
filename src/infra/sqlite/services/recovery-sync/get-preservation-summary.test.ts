import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { allocateDestination } from './allocate-destination';
import { getPreservationSummary } from './get-preservation-summary';
import { clearTables, insertMove } from './recovery-sync.helper.test';

describe('get-preservation-summary', () => {
  let props: Parameters<typeof getPreservationSummary>[0];

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

  it('should count done moves and return the destinations that received them', () => {
    // Given
    allocateDestination({ rootUuid: 'rootUuid', volume: 'C:', path: 'C:/Recovery' });
    allocateDestination({ rootUuid: 'rootUuid', volume: 'D:', path: 'D:/Recovery' });
    insertMove({ uuid: 'uuid1', destination: 'C:/Recovery/a.txt', stage: 'done' });
    insertMove({ uuid: 'uuid2', itemType: 'folder', destination: 'C:/Recovery/Docs', stage: 'done' });
    insertMove({ uuid: 'uuid3', destination: 'D:/Recovery/b.txt', stage: 'failed' });
    insertMove({ uuid: 'uuid4', destination: 'C:/Recovery/c.txt', stage: 'conflict' });
    // When
    const { data } = getPreservationSummary(props);
    // Then
    expect(data).toStrictEqual({ preserved: 2, destinations: ['C:/Recovery'] });
  });

  it('should not count moves of another root', () => {
    // Given
    allocateDestination({ rootUuid: 'otherRootUuid', volume: 'C:', path: 'C:/Recovery' });
    insertMove({ uuid: 'uuid1', rootUuid: 'otherRootUuid', destination: 'C:/Recovery/a.txt', stage: 'done' });
    // When
    const { data } = getPreservationSummary(props);
    // Then
    expect(data).toStrictEqual({ preserved: 0, destinations: [] });
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.rootUuid = (() => null) as any;
    // When
    const { error } = getPreservationSummary(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ msg: 'Error getting recovery sync preservation summary' });
  });
});
