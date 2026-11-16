import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { getUnfinishedMoves } from './get-unfinished-moves';
import { clearTables, insertMove } from './recovery-sync.helper.test';

describe('get-unfinished-moves', () => {
  let props: Parameters<typeof getUnfinishedMoves>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    clearTables();
    props = { rootUuid: 'rootUuid', itemType: 'file' };
  });

  it('should return reserved and moved moves only', () => {
    // Given
    insertMove({ uuid: 'uuid1', stage: 'reserved' });
    insertMove({ uuid: 'uuid2', stage: 'moved' });
    insertMove({ uuid: 'uuid3', stage: 'done' });
    insertMove({ uuid: 'uuid4', stage: 'conflict' });
    insertMove({ uuid: 'uuid5', stage: 'failed' });
    // When
    const { data } = getUnfinishedMoves(props);
    // Then
    expect(data).toMatchObject([
      { uuid: 'uuid1', stage: 'reserved' },
      { uuid: 'uuid2', stage: 'moved' },
    ]);
  });

  it('should not return moves of another root or item type', () => {
    // Given
    insertMove({ uuid: 'uuid1', rootUuid: 'otherRootUuid' });
    insertMove({ uuid: 'uuid2', itemType: 'folder' });
    // When
    const { data } = getUnfinishedMoves(props);
    // Then
    expect(data).toStrictEqual([]);
  });

  it('should return moves in uuid batches', () => {
    // Given
    insertMove({ uuid: 'uuid1' });
    insertMove({ uuid: 'uuid2' });
    insertMove({ uuid: 'uuid3' });
    // When
    const { data } = getUnfinishedMoves({ ...props, afterUuid: 'uuid1', limit: 1 });
    // Then
    expect(data).toMatchObject([{ uuid: 'uuid2' }]);
  });

  it('should return INVALID_ROW when a row does not match the move shape', () => {
    // Given
    insertMove({ uuid: 'uuid1', sourceSize: 'invalid' as any });
    // When
    const { error } = getUnfinishedMoves(props);
    // Then
    expect(error?.code).toBe('INVALID_ROW');
    call(loggerMock.error).toMatchObject({ msg: 'Invalid recovery sync move' });
  });

  it('should return UNKNOWN when error is thrown', () => {
    // Given
    props.rootUuid = (() => null) as any;
    // When
    const { error } = getUnfinishedMoves(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    call(loggerMock.error).toMatchObject({ msg: 'Error getting unfinished recovery sync moves' });
  });
});
