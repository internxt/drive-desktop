import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { isBeingPreserved } from './is-being-preserved';
import { clearTables, insertMove } from './recovery-sync.helper.test';

describe('is-being-preserved', () => {
  let props: Parameters<typeof isBeingPreserved>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    clearTables();
    props = { rootUuid: 'rootUuid', itemType: 'file', uuid: 'uuid1' };
  });

  it.each(['reserved', 'moved', 'done', 'conflict'] as const)('should return true when the move is %s', (stage) => {
    // Given
    insertMove({ uuid: 'uuid1', stage });
    // When
    const { data } = isBeingPreserved(props);
    // Then
    expect(data).toBe(true);
  });

  it('should return false when the move failed', () => {
    // Given
    insertMove({ uuid: 'uuid1', stage: 'failed' });
    // When
    const { data } = isBeingPreserved(props);
    // Then
    expect(data).toBe(false);
  });

  it('should return false when the item has no move in its root and type', () => {
    // Given
    insertMove({ uuid: 'uuid1', rootUuid: 'otherRootUuid' });
    insertMove({ uuid: 'uuid1', itemType: 'folder' });
    // When
    const { data } = isBeingPreserved(props);
    // Then
    expect(data).toBe(false);
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.uuid = (() => null) as any;
    // When
    const { error } = isBeingPreserved(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ msg: 'Error checking recovery sync move' });
  });
});
